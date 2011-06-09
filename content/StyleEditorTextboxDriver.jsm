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
 * The Original Code is mozilla.org code.
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

const EXPORTED_SYMBOLS = ["StyleEditorTextboxDriver"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


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
        previousTextbox.removeEventListener("input", this._onInputBinding);
      }

      aElement.value = previousTextbox.value;
      aElement.selectionStart = previousTextbox.selectionStart;
      aElement.selectionEnd = previousTextbox.selectionEnd;
    }

    // this is a code editor so...
    aElement.spellcheck = false;

    // wire the stuff up
    this._textbox = aElement || this._dummy;
    if (aElement) {
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
   * Set the caret position.
   *
   * @param number aPosition
   *        Position to set the caret to (in characters).
   */
  setCaretPosition: function SETD_setCaretPosition(aPosition)
  {
    this.inputElement.setSelectionRange(aPosition, aPosition);
  },

  /**
   * Event handler for 'input'.
   *
   * @param DOMEvent aEvent
   */
  _onInput: function SETD__onInput(aEvent)
  {
    this._parent.updateStyleSheet();
  }
};

