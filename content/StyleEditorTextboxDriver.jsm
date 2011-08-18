/* vim:set ts=2 sw=2 sts=2 et: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Style Editor code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Cedric Vivier <cedricv@neonux.com> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

const EXPORTED_SYMBOLS = ["StyleEditorTextboxDriver"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const TAB_CHARS   = "\t";
const INDENT_RE   = new RegExp("^", "gm");
const UNINDENT_RE = new RegExp("^" + TAB_CHARS, "gm");

const OS = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
const LINE_SEPARATOR = /win/.test(OS) ? "\r\n" : "\n";


/**
 * StyleEditorTextboxDriver constructor.
 *
 * Drives the StyleEditor incremental parser from a xul:textbox.
 * It does so via a nsIEditActionListener implementation and a DidMoveCaret
 * extension, of course a driver implementation can be completely different
 * to interface with another input/editor (Ace? Orion?).
 *
 * @param StyleEditor parent
 */
function StyleEditorTextboxDriver(parent) {
  this._parent = parent;

  this._dummy = { // dummy textbox interface for headless mode
    value: "",    // (when no input element is set)
    editor: null,
    selectionStart: 0,
    selectionEnd: 0,
    setSelectionRange: function (start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    }
  };

  this._textbox = this._dummy;

  // aEvent handlers
  // we bind them first here so we can remove listeners if textbox is detached
  this._onKeydownBinding = this._onKeydown.bind(this);
  this._onInputBinding = this._onInput.bind(this);
}

StyleEditorTextboxDriver.prototype = {
  /**
   * Retrieve the attached input element.
   *
   * @return DOMElement
   */
  get inputElement() this._textbox,

  /**
   * Set/attach an input element. Previous input element is detached if any.
   *
   * @param DOMElement aElement
   *        The input element to attach to this driver.
   *        If null, the current input element is detached and the driver
   *        switches back to 'headless' mode.
   */
  set inputElement(aElement)
  {
    let previousTextbox = this.inputElement;
    if (previousTextbox) {
      if (previousTextbox != this._dummy) {
        // clean up stuff bound to the previous textbox
        previousTextbox.removeEventListener("keydown", this._onKeydownBinding, false);
        previousTextbox.removeEventListener("input", this._onInputBinding, false);
      }

      if (aElement) {
        aElement.value = prettifyCSS(previousTextbox.value);
        aElement.setSelectionRange(previousTextbox.selectionStart,
                                   previousTextbox.selectionEnd);
      }
    }

    // wire the stuff up
    this._textbox = aElement || this._dummy;
    if (aElement) {
      // force sensible textbox settings for a *code* editor
      aElement.spellcheck = false;
      aElement.style.direction = "ltr";

      aElement.addEventListener("keydown", this._onKeydownBinding, false);
      aElement.addEventListener("input", this._onInputBinding, false);
    }
  },

  /**
   * Retrieve the input text or a substring of the input text.
   *
   * @param number aOffset
   *        Optional offset to start of substring from.
   *        Return full string if not set.
   * @param number aLength
   *        Optional length of substring to return from offset.
   * @return string
   */
  getText: function SETD_getText(aOffset, aLength)
  {
    if (aOffset === undefined) {
      return this.inputElement.value;
    }
    return this.inputElement.value.substring(aOffset,
                        aLength === undefined ? undefined : aOffset + aLength);
  },

  /**
   * Set the input text.
   *
   * @param string aText
   */
  setText: function SETD_setText(aText)
  {
    this.inputElement.value = aText;
  },

  /**
   * Set the caret offset.
   *
   * @param number aOffset
   *        Position to set the caret to (in characters).
   */
  setCaretOffset: function SETD_setCaretOffset(aOffset)
  {
    this.inputElement.setSelectionRange(aOffset, aOffset);
  },

  /**
   * Event handler for 'keydown'.
   *
   * @param DOMEvent aEvent
   */
  _onKeydown: function SETD__onKeydown(aEvent)
  {
    if (aEvent.keyCode == aEvent.DOM_VK_TAB) {
      aEvent.preventDefault();

      let textbox = this.inputElement;
      let selectionStart = textbox.selectionStart;
      let selectionEnd = textbox.selectionEnd;

      if (selectionStart == selectionEnd) {
        // insert tab character
        if (!aEvent.shiftKey) {
          this._replaceText("", TAB_CHARS);
        }
        return;
      }

      // indent/unindent block
      let oldBlock = textbox.value.substring(selectionStart, selectionEnd);
      let newBlock = (!aEvent.shiftKey)
                     ? oldBlock.replace(INDENT_RE, TAB_CHARS)
                     : oldBlock.replace(UNINDENT_RE, "");
      this._replaceText(oldBlock, newBlock);
    }
  },

  /**
   * Event handler for 'input'.
   *
   * @param DOMEvent aEvent
   */
  _onInput: function SETD__onInput(aEvent)
  {
    this._parent.updateStyleSheet();
  },

  /**
   * Replace text at caret or within selection.
   *
   * @param string aOldText
   * @param string aNewText
   */
  _replaceText: function SETD__replaceText(aOldText, aNewText)
  {
    let textbox = this.inputElement;
    let selectionStart = textbox.selectionStart;
    let selectionEnd = textbox.selectionEnd;
    let caretAdjustment = aNewText.length - aOldText.length;

    textbox.value = [textbox.value.substring(0, selectionStart),
                     aNewText,
                     textbox.value.substring(selectionEnd)].join("");

    if (selectionStart == selectionEnd) {
      selectionStart = selectionEnd + caretAdjustment;
    }
    textbox.setSelectionRange(selectionStart,
                              selectionEnd + caretAdjustment);
  }
};
