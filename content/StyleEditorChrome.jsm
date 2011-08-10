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

const EXPORTED_SYMBOLS = ["StyleEditorChrome"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const STYLE_EDITOR_CONTENT = "chrome://StyleEditor/content/";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditor.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditorUtil.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "AdaptiveSplitView.jsm");

const STYLE_EDITOR_TEMPLATE = "stylesheet";


/**
 * StyleEditorChrome constructor.
 *
 * The 'chrome' of the Style Editor is all the around the actual editor (textbox).
 * Manages the sheet selector, history, and opened editor(s) for the attached
 * content window.
 *
 * @param DOMElement aRoot
 *        Element that owns the chrome UI.
 * @param DOMWindow aContentWindow
 *        Optional content DOMWindow to attach to this chrome.
 *        Default: the currently active browser tab content window.
 */
function StyleEditorChrome(aRoot, aContentWindow)
{
  assert(aRoot, "Argument 'aRoot' is required to initialize StyleEditorChrome.");

  this._root = aRoot;
  this._document = this._root.ownerDocument;
  this._window = this._document.defaultView;

  let viewRoot = this._root.parentNode.querySelector(".splitview-root");
  this._view = new AdaptiveSplitView(viewRoot);
  this._setupChrome();

  // finally attach to the content window
  this.contentWindow = aContentWindow || getCurrentBrowserTabContentWindow();

  this.contentWindow.addEventListener("unload", function onContentUnload() {
    this.contentWindow.removeEventListener("unload", onContentUnload, false);
    this.contentWindow = null;
  }.bind(this), false);
}

StyleEditorChrome.prototype = {
  /**
   * Retrieve the content window attached to this chrome.
   *
   * @return DOMWindow
   */
  get contentWindow() this._contentWindow,

  /**
   * Set the content window attached to this chrome.
   *
   * @param DOMWindow aContentWindow
   */
  set contentWindow(aContentWindow)
  {
    if (this._contentWindow == aContentWindow) {
      return; // no change
    }
    this._contentWindow = aContentWindow;
    if (aContentWindow) {
      this._populateChrome();
    } else {
      this._disableChrome();
    }
  },

  /**
   * Retrieve the content document attached to this chrome.
   *
   * @return DOMDocument
   */
  get contentDocument()
  {
    return this._contentWindow ? this._contentWindow.document : null;
  },

  /**
   * Retrieve an array with the StyleEditor instance for each style sheet,
   * ordered by style sheet index.
   *
   * @return Array<StyleEditor>
   */
  get editors()
  {
    let editors = [];
    this.forEachStyleSheet(function (aEditor) {
      editors[aEditor.styleSheetIndex] = aEditor;
    });
    return editors;
  },

  /**
   * Set up the chrome UI. Install event listeners and so on.
   */
  _setupChrome: function SEC__setupChrome()
  {
    // wire up UI elements
    wire(this._view.rootElement, ".style-editor-newButton", function onNewButton() {
      let editor = new StyleEditor(this.contentDocument);
      editor.addActionListener(this);
      editor.load();
    }.bind(this));

    wire(this._view.rootElement, ".style-editor-importButton", function onImportButton() {
      let editor = new StyleEditor(this.contentDocument);
      editor.addActionListener(this);
      editor.importFromFile(null, this._window);
    }.bind(this));
  },

  /**
   * Iterates every StyleEditor instance for each stylesheet in content document.
   * Iteration stops if aCallback returns true.
   *
   * @param function aCallback(aEditor)
   */
  forEachStyleSheet: function SEC_forEachStyleSheet(aCallback)
  {
    this._view.forEachItem(function (aSummary, aDetails, aData) {
      if (aCallback(aData.editor)) {
        return true;
      }
    });
  },

  /**
   * Reset the chrome UI to an empty state.
   */
  _resetChrome: function SEC__resetChrome()
  {
    this._view.removeAll();
  },

  /**
   * Populate the chrome UI according to the content document.
   *
   * @see StyleEditor._setupShadowStyleSheet
   */
  _populateChrome: function SEC__populateChrome()
  {
    this._resetChrome();

    this._document.title = _("chromeWindowTitle",
          this.contentDocument.title || this.contentDocument.location.href);

    let document = this.contentDocument;
    for (let i = 0; i < document.styleSheets.length; ++i) {
      let styleSheet = document.styleSheets[i];

      let editor = new StyleEditor(document, styleSheet);
      editor.addActionListener(this);
      editor.load();
    }
  },

  /**
   * Disable all UI, effectively making editors read-only.
   * This is automatically called when no content window is attached.
   *
   * @see contentWindow
   */
  _disableChrome: function SEC__disableChrome()
  {
    let matches = this._root.querySelectorAll("button,input,select");
    for (let i = 0; i < matches.length; ++i) {
      matches[i].setAttribute("disabled", "disabled");
    }
    matches = this._root.querySelectorAll("textarea");
    for (let i = 0; i < matches.length; ++i) {
      matches[i].setAttribute("readonly", "readonly");
    }

    this._view.rootElement.setAttribute("disabled", "disabled");
  },

  /**
   * Update split view summary of given StyleEditor instance.
   *
   * @param StyleEditor aEditor
   * @param DOMElement aSummary
   *        Optional item's summary element to update. If none, item corresponding
   *        to passed aEditor is used.
   */
  _updateSummaryForEditor: function SEC__updateSummaryForEditor(aEditor, aSummary)
  {
    let summary = aSummary;
    if (!summary) {
      this._view.forEachContent(function (aSummary, aDetails, aData) {
        if (aData.editor == aEditor) {
          summary = aSummary;
          return true;
        }
      });
    }

    this._view.setItemClassName(summary, aEditor.flags);

    text(summary, ".stylesheet-name", aEditor.getFriendlyName());
    text(summary, ".stylesheet-title", aEditor.styleSheet.title || "");
    text(summary, ".stylesheet-rule-count",
         _("ruleCount.label", aEditor.styleSheet.cssRules.length));

    text(summary, ".stylesheet-error-message", aEditor.errorMessage);
/*TODO:
    if (styleSheet.scoped) {
      let scoped = this._xul("label", "stylesheet-scoped");
      scoped.setAttribute("value", "&scoped.label;");
      details.appendChild(scoped);
    }

    this._appendMediaLabels(aEditor, details);
*/
  },

  /**
   * Append media labels to an element from an editor's stylesheet media list.
   *
   * @param StyleEditor aEditor
   * @param DOMElement aParent
   */
//FIXME: HTML-ize!
  _appendMediaLabels: function SEC__appendMediaLabels(aEditor, aParent)
  {
    for (let i = 0; i < aEditor.styleSheet.media.length; ++i) {
      let media = aEditor.styleSheet.media[i];
      let mql = this._safeMatchMedia(media);
      let label = this._xul("label", "stylesheet-media");
      label.setAttribute("crop", "center");

      if (mql && mql.media != "not all") {
        label.setAttribute("value", mql.media);
        label.setAttribute("disabled", !mql.matches);

        // bind media query listener to the chrome instance so that it does
        // not leak when deleting stylesheets. Chrome instances are singletons
        // for any given content window.
        if (!this._mediaQueryListener) {
          this._mediaQueryListener = this._onMediaQueryChange.bind(this);
        }
        mql.addListener(this._mediaQueryListener);
      }

      aParent.appendChild(label);
    }
  },

  /**
   * Called when a media query list notifies change.
   *
   * @param MediaQueryList aMql
   */
//FIXME: HTML-ize!
  _onMediaQueryChange: function SEC__onMediaQueryChange(aMql)
  {
    let list = this._UI.styleSheetList;
    let labels = list.querySelectorAll("label.stylesheet-media");
    for (let i = 0; i < labels.length; ++i) {
      let label = labels[i];
      if (label.value == aMql.media) {
        label.setAttribute("disabled", !aMql.matches);
      }
    }
  },

  /**
   * Safely retrieve MediaQueryList for named media.
   *
   * @param string aMediaText
   * @return MediaQueryList
   */
  _safeMatchMedia: function SEC__safeMatchMedia(aMediaText)
  {
    try {
      return this.contentWindow.matchMedia(aMediaText);
    } catch (e) {
      return null;
    }
  },

  /**
   * IStyleEditorActionListener implementation
   * @See StyleEditor.addActionListener.
   */

  /**
   * Called when source has been loaded and editor is ready for some action.
   *
   * @param StyleEditor aEditor
   */
  onLoad: function SEAL_onLoad(aEditor)
  {
    let item = this._view.appendTemplatedItem(STYLE_EDITOR_TEMPLATE, {
      data: {
        editor: aEditor
      },
      ordinal: aEditor.styleSheetIndex,
      onCreate: function ASV_onCreate(aSummary, aDetails, aData) {
        let editor = aData.editor;

        wire(aSummary, ".stylesheet-enabled", function onToggleEnabled(evt) {
          evt.stopPropagation();
          evt.target.blur();

          editor.enableStyleSheet(editor.styleSheet.disabled);
        });

        wire(aSummary, ".stylesheet-saveButton", function onSaveButton(evt) {
          evt.stopPropagation();
          evt.target.blur();

          editor.saveToFile(editor.savedFile);
        });

        this._updateSummaryForEditor(editor, aSummary);

        editor.inputElement = aDetails.querySelector(".stylesheet-editor-input");
        editor.inputElement.focus();

        // autofocus first or new stylesheet
        if (editor.styleSheetIndex == 0 ||
            editor.hasFlag(StyleEditorFlags.NEW)) {
          this._view.activeSummary = aSummary;
        }
      }.bind(this),
      onShow: function ASV_onShow(aSummary, aDetails, aData) {
        let editor = aData.editor;
        editor.inputElement.focus();
      },
      onFilterBy: function ASV_onFilterBy(aSummary, aDetails, aData, aQuery) {
        let editor = aData.editor;
        return editor.inputElement.value.indexOf(aQuery) > -1;
      }
    });
  },

  /**
   * Called when an editor flag changed.
   *
   * @param StyleEditor aEditor
   * @param string aFlagName
   * @see StyleEditor.flags
   */
  onFlagChange: function SEAL_onFlagChange(aEditor, aFlagName)
  {
    this._updateSummaryForEditor(aEditor);
  },

  /**
   * Called when  when changes have been committed/applied to the live DOM
   * stylesheet.
   *
   * @param StyleEditor aEditor
   */
  onCommit: function SEAL_onCommit(aEditor)
  {
    this._updateSummaryForEditor(aEditor);
  },
};
