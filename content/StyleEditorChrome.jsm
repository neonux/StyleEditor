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

const EXPORTED_SYMBOLS = ["StyleEditorChrome"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const STYLE_EDITOR_CONTENT = "chrome://StyleEditor/content/";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditor.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditorUtil.jsm");


const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
// url to the stand-alone UI
const STYLE_EDITOR_STANDALONE_XUL = "StyleEditor.xul";


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
  assert(aRoot, "Argument 'aRoot' is required.");

  this._root = aRoot;
  this._document = getDocumentForElement(this._root);
  this._window = this._document.defaultView;

  this._UI = {}; // object to store references to frequently used UI elements
  this._setupChrome();

  // finally attach to the content window
  this._contentWindow = null;
  this.contentWindow = aContentWindow || getCurrentBrowserTabContentWindow();
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
    this._populateChrome();
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
    // store references to frequently used UI elements
    this._UI.styleSheetList = this._root.querySelector("#style-editor-styleSheetList");
    this._UI.tabPanels = this._root.querySelector("#style-editor-tabPanels");
    this._UI.tabs = this._root.querySelector("#style-editor-tabs");
    this._UI.saveAllButton = this._root.querySelector("#style-editor-saveAllButton");

    // wire up UI elements
    wire(this._root, "#style-editor-newButton", function onNewButton() {
      let editor = new StyleEditor(this.contentDocument);
      editor.addActionListener(this);
      editor.load();
      this._openTabForEditor(editor);
    }.bind(this));
    wire(this._root, this._UI.saveAllButton, function onSaveAllButton() {
      this.forEachStyleSheet(function saveIfUnsaved(aEditor) {
        if (!aEditor.hasFlag(aEditor.UNSAVED_FLAG)) {
          return;
        }
        if (aEditor.saveToFile(aEditor.savedFile)) {
          this._unsavedCount--;
        }
      });
    }.bind(this));
  },

  /**
   * Iterates the StyleEditor instance and Stylesheets list item for each
   * stylesheet in the content document.
   * Iteration stops if aCallback returns true.
   *
   * @param function aCallback(editor, styleSheetListItem)
   */
  forEachStyleSheet: function SEC_forEachStyleSheet(aCallback)
  {
    let items = this._UI.styleSheetList.childNodes;
    for (let i = 0; i < items.length; ++i) {
      let editor = items[i].getUserData("editor");
      if (editor && aCallback(editor, items[i])) {
        return;
      }
    }
  },

  /**
   * Reset the chrome UI to an empty state.
   */
  _resetChrome: function SEC__resetChrome()
  {
    this._UI.styleSheetList.innerHTML = "";
  },

  /**
   * Populate the chrome UI according to the content document.
   *
   * @see StyleEditor._setupShadowStyleSheet
   */
  _populateChrome: function SEC__populateChrome() {
    this._resetChrome();

    let document = this.contentDocument;
    for (let i = 0; i < document.styleSheets.length; ++i) {
      let styleSheet = document.styleSheets[i];

      let editor = new StyleEditor(document, styleSheet);
      editor.addActionListener(this);
      editor.load();
    }
  },

  /**
   * Retrieve the Stylesheets list item for an editor.
   *
   * @param StyleEditor aEditor
   * @return DOMElement
   *         Item element for the editor in Stylesheets list, null otherwise.
   */
  _getItemForEditor: function SEC__getItemForEditor(aEditor)
  {
    let item = null;
    this.forEachStyleSheet(function (aOneEditor, aItem) {
      if (aOneEditor == aEditor) {
        item = aItem;
        return true;
      }
    });
    return item;
  },

  /**
   * Retrieve the tab panel element for an editor.
   *
   * @param StyleEditor aEditor
   * @return DOMElement
   *         Tab panel element for the editor, null if not found.
   */
  _getTabForEditor: function SEC__getTabForEditor(aEditor)
  {
    let panel = this._UI.tabPanels.children[0];
    while (panel) {
      if (panel.getUserData("editor") == aEditor) {
        return panel;
      }
      panel = panel.nextElementSibling;
    }
    return null;
  },

  /**
   * Select the tab for given editor or create a new tab if no tab for this editor
   * has been opened yet.
   *
   * @param StyleEditor aEditor
   * @return DOMElement
   *         Tab element for the editor.
   */
  _openTabForEditor: function SEC__openEditorTab(aEditor)
  {
    let tabPanel = this._getTabForEditor(aEditor);
    if (!tabPanel) {
      tabPanel = this._newTabForEditor(aEditor);
      this._updateTabForEditor(aEditor);
    }

    this._UI.tabPanels.selectedPanel = tabPanel;
    this._UI.tabs.selectedIndex = this._UI.tabPanels.selectedIndex

    if (aEditor.inputElement) {
      aEditor.inputElement.focus();
    }
    return tabPanel;
  },

  /**
   * Create a new tab for an editor.
   *
   * @param StyleEditor aEditor
   * @return DOMElement
   *         Tab element for the editor.
   */
  _newTabForEditor: function SEC__newTabForEditor(aEditor)
  {
    let tab = this._UI.tabs.appendItem(aEditor.getFriendlyName());
    tab.setAttribute("crop", "start");

    let tabPanel = this._xul("tabpanel");
    tabPanel.setUserData("editor", aEditor, null);
    tabPanel.setUserData("tab", tab, null);
    tabPanel.setAttribute("flex", "1");

    let frame = this._xul("iframe");
    frame.setAttribute("flex", "1");
    frame.setAttribute("src", STYLE_EDITOR_STANDALONE_XUL);
    tabPanel.appendChild(frame);

    this._UI.tabPanels.appendChild(tabPanel);

    // set up editor UI when the stand-alone editor frame is loaded
    let editorChrome = this;
    frame.contentWindow.addEventListener("load", function onFrameLoad() {
      frame.contentWindow.removeEventListener("load", onFrameLoad);

      let document = this.document;

      aEditor.inputElement = document.querySelector(".stylesheet-editor-input");

      wire(document, ".stylesheet-enabled", function onEnabledButton() {
          aEditor.enableStyleSheet(this.checked);
      });
      wire(document, ".stylesheet-save", function onSaveButton() {
        aEditor.saveToFile(aEditor.savedFile);
      });

      if (editorChrome.debugMode) {
        setupDebugUIForEditor(aEditor, document);
      }

      aEditor.inputElement.focus();
    }, false);

    return tabPanel;
  },

  /**
   * Update the Stylesheets list item of an editor.
   *
   * @param StyleEditor aEditor
   */
  _updateItemForEditor: function SEC__updateItemForEditor(aEditor)
  {
    let item = this._getItemForEditor(aEditor);

    item.className = aEditor.flags;

    attr(item, ".stylesheet-name", "value", aEditor.getFriendlyName());
    attr(item, ".stylesheet-rule-count", "value",
         _("ruleCount.label", aEditor.styleSheet.cssRules.length));
    attr(item, ".stylesheet-enabled", "checked", !aEditor.styleSheet.disabled);
  },

  /**
   * Update the tab UI of an editor.
   *
   * @param StyleEditor aEditor
   */
  _updateTabForEditor: function SEC__updateTabForEditor(aEditor)
  {
    let tabPanel = this._getTabForEditor(aEditor);
    if (!tabPanel) {
      return; // editor is not open
    }

    let tab = tabPanel.getUserData("tab");
    tab.className = tabPanel.className = aEditor.flags;

    let friendlyName = aEditor.getFriendlyName();
    tab.setAttribute("label", friendlyName);

    if (aEditor.window) {
      let editorXULWindow = aEditor.window.document.documentElement;
      editorXULWindow.className = aEditor.flags;
      editorXULWindow.setAttribute("title", friendlyName);
    }
  },

  /**
   * Create a new Style sheets list item for an editor.
   *
   * @param StyleEditor aEditor
   * @return DOMElement
   *         New list item element.
   */
  _newItemForEditor: function SEC__newItemForEditor(aEditor)
  {
    let styleSheet = aEditor.styleSheet;

    let item = this._xul("richlistitem");
    item.setUserData("editor", aEditor, null);

    let checkbox = this._xul("checkbox", "stylesheet-enabled");
    checkbox.setAttribute("tooltiptext", "&enabledButton.tooltip;");
    checkbox.addEventListener("command", function onToggleStyleSheet(evt) {
      evt.stopPropagation();
      aEditor.enableStyleSheet(evt.target.checked);
    }, false);
    item.appendChild(checkbox);

    let vbox = this._xul("vbox");
    vbox.setAttribute("flex", "1");

    let name = this._xul("label", "stylesheet-name");
    name.setAttribute("crop", "start");
    name.setAttribute("value", aEditor.getFriendlyName());
    vbox.appendChild(name);

    let title = this._xul("label", "stylesheet-title");
    title.setAttribute("crop", "end");
    title.setAttribute("value", styleSheet.title || "");
    vbox.appendChild(title);

    let details = this._xul("hbox", "stylesheet-details");

    let count = this._xul("label", "stylesheet-rule-count");
    details.appendChild(count);

    if (styleSheet.scoped) {
      let scoped = this._xul("label", "stylesheet-scoped");
      scoped.setAttribute("value", "&scoped.label;");
      details.appendChild(scoped);
    }

    vbox.appendChild(details);
    item.appendChild(vbox);

    let spacer = this._xul("spacer");
    spacer.setAttribute("flex", "1");
    item.appendChild(spacer);

    item.addEventListener("dblclick", function onOpenStyleSheet(evt) {
      evt.stopPropagation();
      this._openTabForEditor(aEditor);
    }.bind(this), false);

    // insert item at the correct index
    // (editor load is asynchronous so we have to check now where to insert)
    let insertionPoint = this._UI.styleSheetList.firstElementChild;
    while (insertionPoint) {
      let itemEditor = insertionPoint.getUserData("editor");
      if (itemEditor.styleSheetIndex > aEditor.styleSheetIndex) {
        return this._UI.styleSheetList.insertBefore(item, insertionPoint);
      }
      insertionPoint = insertionPoint.nextElementSibling;
    }

    return this._UI.styleSheetList.appendChild(item);
  },

  /**
   * Create a new XUL element.
   *
   * @param string aTagName
   *        Tag name of the new element.
   * @param string aClassName
   *        Optional class name.
   * @return DOMElement
   */
  _xul: function SEC__xul(aTagName, aClassName)
  {
    let element = this._document.createElementNS(XUL_NS, aTagName);
    if (aClassName) {
      element.className = aClassName;
    }
    return element;
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
    // insert editor's style sheet in the list
    this._newItemForEditor(aEditor);

    this._updateItemForEditor(aEditor);
    this._updateTabForEditor(aEditor);
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
    this._updateItemForEditor(aEditor);
    this._updateTabForEditor(aEditor);

    if (aFlagName == aEditor.UNSAVED_FLAG) {
      /* display Save All button when there is at least one unsaved editor */
      this._unsavedCount = this._unsavedCount || 0;
      this._unsavedCount += aEditor.hasFlag(aEditor.UNSAVED_FLAG) ? 1 : -1;
      this._UI.saveAllButton.className = this._unsavedCount ? "" : "hidden";
    }
  }
};
