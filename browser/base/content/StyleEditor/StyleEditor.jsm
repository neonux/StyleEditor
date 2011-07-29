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

const EXPORTED_SYMBOLS = ["StyleEditor", "StyleEditorFlags"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const STYLE_EDITOR_CONTENT = "chrome://browser/content/StyleEditor/";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditorUtil.jsm");
Cu.import(STYLE_EDITOR_CONTENT + "StyleEditorTextboxDriver.jsm");

const LOAD_ERROR = "error-load";

// update at most every 250ms (avoid potential typing lag and/or flicker)
const UPDATE_STYLESHEET_THROTTLE_DELAY = 250;


/**
 * StyleEditor constructor.
 *
 * The StyleEditor is initialized 'headless', it does not display source
 * or receive input. Setting inputElement attaches a DOMElement to handle this.
 *
 * An editor can be created stand-alone or created by StyleEditorChrome to
 * manage all the style sheets of a document, including @import'ed sheets.
 *
 * @param DOMDocument aDocument
 *        The content document where changes will be applied to.
 * @param DOMStyleSheet aStyleSheet
 *        Optional. The DOMStyleSheet to edit.
 *        If not set, a new empty style sheet will be appended to the document.
 * @see inputElement
 * @see StyleEditorChrome
 */
function StyleEditor(aDocument, aStyleSheet)
{
  assert(aDocument, "Argument 'aDocument' is required.");

  this._document = aDocument; // @see contentDocument
  this._window = null;        // @see window
  this._inputElement = null;  // @see inputElement

  this._styleSheet = aStyleSheet;
  this._styleSheetIndex = -1; // unknown for now, will be set after load

  this._flags = [];           // @see flags

  // listeners for significant editor actions. @see addActionListener
  this._actionListeners = [];

  // wire up with the underlying textbox/editor
  this._driver = new StyleEditorTextboxDriver(this);
}

StyleEditor.prototype = {
  /**
   * Retrieve the content document this editor will apply changes to.
   *
   * @return DOMDocument
   */
  get contentDocument() this._document,

  /**
   * Retrieve the stylesheet this editor is attached to.
   *
   * @return DOMStyleSheet
   */
  get styleSheet()
  {
    assert(this._styleSheet, "StyleSheet must be loaded first.")
    return this._styleSheet;
  },

  /**
   * Retrieve the index (order) of stylesheet in the document.
   *
   * @return number
   */
  get styleSheetIndex()
  {
    let document = this.contentDocument;
    if (this._styleSheetIndex == -1) {
      for (let i = 0; i < document.styleSheets.length; ++i) {
        if (document.styleSheets[i] == this.styleSheet) {
          this._styleSheetIndex = i;
          break;
        }
      }
    }
    return this._styleSheetIndex;
  },

  /**
   * Retrieve the input element that handles display and input for this editor.
   *
   * @return DOMElement
   */
  get inputElement() this._inputElement,

  /**
   * Set the input element that handles display and input for this editor.
   * This detaches the previous input element if any were set.
   *
   * @param DOMElement aElement
   */
  set inputElement(aElement)
  {
    // set 'open' flag on this editor if we are attaching, clear otherwise
    this.toggleFlag(aElement, StyleEditorFlags.OPEN);

    this._window = null;

    this._inputElement = aElement;
    this._driver.inputElement = aElement; // attach to the input driver

    this._triggerAction(aElement ? "Attached" : "Detached");
  },

  /**
   * Retrieve the window that contains the editor.
   *
   * @return DOMWindow
   */
  get window()
  {
    if (!this._window && this.inputElement) {
      this._window = this.inputElement.ownerDocument.defaultView;
    }
    return this._window;
  },

  /**
   * Load style sheet source into the editor, asynchronously.
   * "Load" action triggers when complete.
   *
   * @see addActionListener
   */
  load: function SE_load()
  {
    if (!this._styleSheet) {
      this._flags.push(StyleEditorFlags.NEW);
      this._appendNewStyleSheet();
    }
    this._loadSource();
  },

  /**
   * Get a user-friendly name for the style sheet.
   *
   * @return string
   */
  getFriendlyName: function SE_getFriendlyName()
  {
    if (!this.styleSheet.href) {
      let index = this.styleSheetIndex + 1; // 0-indexing only works for devs
      return _("inlineStyleSheet", index);
    }

    if (!this._friendlyName) {
      let sheetURI = this.styleSheet.href;
      let contentURI = this.contentDocument.defaultView.location.href;
      let sheetURIIsRelativeToContentURI = (sheetURI.indexOf(contentURI) == 0);

      // avoid verbose repetition of absolute URI when the style sheet
      // URI is relative to the content URI
      this._friendlyName = (sheetURIIsRelativeToContentURI)
                           ? sheetURI.substring(contentURI.length)
                           : sheetURI;
    }
    return this._friendlyName;
  },

  /**
   * Add a listener for significant/semantic StyleEditor actions.
   *
   * The listener implements IStyleEditorActionListener := {
   *   onLoad:                 Called when the style sheet has been loaded and
   *                           parsed.
   *                           Arguments: (editor)
   *
   *   onFlagChange:           Called when a flag has been set or cleared.
   *                           Arguments: (editor, flagName)
   *                           @see setFlag
   *
   *   onAttached:             Called when an input element has been attached.
   *                           Arguments: (editor)
   *                           @see inputElement
   *
   *   onDetached:             Called when input element has been detached.
   *                           Arguments: (editor)
   *                           @see inputElement
   *
   *   onCommit:               Called when changes have been committed/applied
   *                           to the live DOM style sheet.
   *                           Arguments: (editor)
   * }
   *
   * A listener does not have to implement all of the interface above, actions
   * whose handler is not a function are ignored.
   *
   * @param IStyleEditorActionListener aListener
   * @see removeActionListener
   */
  addActionListener: function SE_addActionListener(aListener)
  {
    this._actionListeners.push(aListener);
    if (this._loaded) { // trigger load event when already loaded
      if (aListener.onLoad) {
        aListener.onLoad(this);
      }
    }
  },

  /**
   * Remove a listener for editor actions from the current list of listeners.
   *
   * @param IStyleEditorActionListener aListener
   * @return boolean
   *         True if listener has been found and removed, false otherwise.
   * @see addActionListener
   */
  removeActionListener: function SE_removeActionListener(aListener)
  {
    let index = this._actionListeners.indexOf(aListener);
    if (index == -1) {
      return false;
    }
    this._actionListeners.splice(index, 1);
    return true;
  },

  /**
   * Editor UI flags.
   *
   * These are 1-bit indicators that can be used for UI feedback/indicators or
   * extensions to track the editor status.
   * Since they are simple strings, they promote loose coupling and can simply
   * map to CSS class names, which allows to 'expose' indicators declaratively
   * via CSS (including possibly complex combinations).
   *
   * Flag changes can be tracked via onFlagChange (@see addActionListener).
   *
   * @see StyleEditorFlags
   */

  /**
   * Retrieve a space-separated string of all UI flags set on this editor.
   *
   * @return string
   * @see setFlag
   * @see clearFlag
   */
  get flags() this._flags.join(" "),

  /**
   * Set a flag.
   *
   * @param string aName
   *        Name of the flag to set. One of StyleEditorFlags members.
   * @return boolean
   *         True if the flag has been set, false if flag is already set.
   * @see StyleEditorFlags
   */
  setFlag: function SE_setFlag(aName)
  {
    let prop = aName.toUpperCase();
    assert(StyleEditorFlags[prop], "Unknown flag: " + prop);

    if (this.hasFlag(aName)) {
      return false;
    }
    this._flags.push(aName);
    this._triggerAction("FlagChange", [aName]);
    return true;
  },

  /**
   * Clear a flag.
   *
   * @param string aName
   *        Name of the flag to clear.
   * @return boolean
   *         True if the flag has been cleared, false if already clear.
   */
  clearFlag: function SE_clearFlag(aName)
  {
    let index = this._flags.indexOf(aName);
    if (index == -1) {
      return false;
    }
    this._flags.splice(index, 1);
    this._triggerAction("FlagChange", [aName]);
    return true;
  },

  /**
   * Toggle a flag, according to a condition.
   *
   * @param aCondition
   *        If true the flag is set, otherwise cleared.
   * @param string aName
   *        Name of the flag to toggle.
   * @return boolean
   *        True if the flag has been set or cleared, ie. the flag got switched.
   */
  toggleFlag: function SE_toggleFlag(aCondition, aName)
  {
    return (aCondition) ? this.setFlag(aName) : this.clearFlag(aName);
  },

  /**
   * Check if given flag is set.
   *
   * @param string aName
   *        Name of the flag to check presence for.
   * @return boolean
   *         True if the flag is set, false otherwise.
   */
  hasFlag: function SE_hasFlag(aName) (this._flags.indexOf(aName) != -1),

  /**
   * Enable or disable style sheet.
   *
   * @param boolean aEnabled
   */
  enableStyleSheet: function SE_enableStyleSheet(aEnabled)
  {
    this.styleSheet.disabled = !aEnabled;
    this.toggleFlag(this.styleSheet.disabled, StyleEditorFlags.DISABLED);

    if (this._updateTask) {
      this._updateStyleSheet(); // perform cancelled update
    }
  },

  /**
   * Queue a throttled task to update style sheet with new source.
   */
  updateStyleSheet: function SE_updateStyleSheet()
  {
    let window = this.contentDocument.defaultView;

    if (this._updateTask) {
      // cancel previous queued task not executed within throttle delay
      window.clearTimeout(this._updateTask);
    }

    this._updateTask = window.setTimeout(this._updateStyleSheet.bind(this),
                                         UPDATE_STYLESHEET_THROTTLE_DELAY);
  },

  /**
   * Update style sheet with new source.
   */
  _updateStyleSheet: function SE__updateStyleSheet()
  {
    this.setFlag(StyleEditorFlags.UNSAVED);

    if (this.styleSheet.disabled) {
      return;
    }
    this._updateTask = null;

    let source = this._driver.getText();
    let oldNode = this.styleSheet.ownerNode;
    let oldIndex = this.styleSheetIndex;

    let newNode = this.contentDocument.createElement("style");
    newNode.setAttribute("type", "text/css");
    newNode.appendChild(this.contentDocument.createTextNode(source));
    oldNode.parentNode.replaceChild(newNode, oldNode);

    this._styleSheet = this.contentDocument.styleSheets[oldIndex];

    this._triggerAction("Commit");
  },

  /**
   * Retrieve the style sheet source from the cache or from a local file.
   */
  _loadSource: function SE__loadSource()
  {
    if (!this.styleSheet.href) {
      // this is an inline <style> sheet
      this._flags.push(StyleEditorFlags.INLINE);
      this._onSourceLoad(this.styleSheet.ownerNode.textContent);
      return;
    }

    let scheme = Services.io.extractScheme(this.styleSheet.href);
    switch (scheme) {
      case "file":
      case "chrome":
      case "resource":
        this._loadSourceFromFile(this.styleSheet.href);
        break;

      default:
        this._loadSourceFromCache(this.styleSheet.href);
        break;
    }
  },

  /**
   * Load source from a file or file-like resource.
   *
   * @param string aHref
   *        URL for the stylesheet.
   */
  _loadSourceFromFile: function SE__loadSourceFromFile(aHref)
  {
    try {
      NetUtil.asyncFetch(aHref, function onFetch(aStream, aStatus) {
        if (!Components.isSuccessCode(aStatus)) {
          return this._signalError(LOAD_ERROR);
        }
        let source = NetUtil.readInputStreamToString(aStream, aStream.available());
        aStream.close();
        this._onSourceLoad(source);
      }.bind(this));
    } catch (ex) {
      this._signalError(LOAD_ERROR);
    }
  },

  /**
   * Load source from the HTTP cache.
   *
   * @param string aHref
   *        URL for the stylesheet.
   */
  _loadSourceFromCache: function SE__loadSourceFromCache(aHref)
  {
    try {
      let cacheService = Cc["@mozilla.org/network/cache-service;1"]
                           .getService(Ci.nsICacheService);
      let session = cacheService.createSession("HTTP", Ci.nsICache.STORE_ANYWHERE, true);
      session.doomEntriesIfExpired = false;
      session.asyncOpenCacheEntry(aHref, Ci.nsICache.ACCESS_READ, {
        onCacheEntryAvailable: function onCacheEntryAvailable(aEntry, aMode, aStatus) {
          if (!Components.isSuccessCode(aStatus)) {
            return this._signalError(LOAD_ERROR);
          }

          let source = "";
          let stream = entry.openInputStream(0);
          let head = entry.getMetaDataElement("response-head");

          if (/Content-Encoding:\s*gzip/i.test(head)) {
            let converter = Cc["@mozilla.org/streamconv;1?from=gzip&to=uncompressed"]
                              .createInstance(Ci.nsIStreamConverter);
            converter.asyncConvertData("gzip", "uncompressed", {
              onDataAvailable: function onDataAvailable(aRequest, aContext, aUncompressedStream, aOffset, aCount) {
                source += NetUtil.readInputStreamToString(aUncompressedStream, aCount);
              }
            }, this);
            while (stream.available()) {
              converter.onDataAvailable(null, this, stream, 0, stream.available());
            }
          } else {
            // uncompressed data
            while (stream.available()) {
              source += NetUtil.readInputStreamToString(stream, stream.available());
            }
          }

          stream.close();
          entry.close();
          this._onSourceLoad(source);
        }.bind(this)
      });
    } catch (ex) {
      this._signalError(LOAD_ERROR);
    }
  },

  /**
   * Called when source has been loaded.
   *
   * @param string aSourceText
   */
  _onSourceLoad: function SE__onSourceLoad(aSourceText)
  {
    this._driver.setText(aSourceText);
    this._driver.setCaretPosition(0);
    this._triggerAction("Load");
    this._loaded = true;
  },

  /**
   * Create a new style sheet and append it to the content document.
   *
   * @param string aText
   *        Optional CSS text.
   */
  _appendNewStyleSheet: function SE__appendNewStyleSheet(aText)
  {
    let document = this.contentDocument;
    let parent = document.body;
    let style = document.createElement("style");
    style.setAttribute("type", "text/css");
    if (aText) {
      style.appendChild(document.createTextNode(aText));
    }
    parent.appendChild(style);

    this._styleSheet = document.styleSheets[document.styleSheets.length - 1];
  },

  /**
   * Signal an error to the user.
   *
   * @param aErrorCode
   *        String name for the localized error property in the string bundle.
   * @param ...rest
   *        Optional arguments to pass for message formatting.
   * @see StyleEditorUtil._
   */
  _signalError: function SE__signalError(aErrorCode)
  {
    this.setFlag(StyleEditorFlags.ERROR);

    if (!_inputElement || _inputElement.parentNode != "notificationbox") {
      return;
    }

    let notificationBox = _inputElement.parentNode;
    let message = _.apply(null,
                          [aErrorCode + ".label"].concat(arguments.slice(1)));
    notificationBox.appendNotification(message,
                                       aErrorCode,
                                       "",
                                       notificationBox.PRIORITY_WARNING_HIGH,
                                       []);
  },

  /**
   * Trigger named action.
   *
   * @param aName
   *        Name of the action to trigger.
   * @param aArgs
   *        Optional array of arguments to pass to the listener(s).
   * @see addActionListener
   */
  _triggerAction: function SE__triggerAction(aName, aArgs)
  {
    // insert the origin editor instance as first argument
    if (!aArgs) {
      aArgs = [this];
    } else {
      aArgs.splice(0, 0, this);
    }

    // trigger all listeners that have this action handler
    for (let i = 0; i < this._actionListeners.length; ++i) {
      let listener = this._actionListeners[i];
      let actionHandler = listener["on" + aName];
      if (actionHandler) {
        actionHandler.apply(listener, aArgs);
      }
    }
  }
};

/**
 * List of StyleEditor UI flags.
 * A Style Editor add-on using its own flag needs to add it to this object.
 *
 * @see StyleEditor.setFlag
 */
let StyleEditorFlags = {
  DISABLED:      "disabled",
  ERROR:         "error",
  IMPORTED:      "imported",
  INLINE:        "inline",
  MODIFIED:      "modified",
  NEW:           "new",
  OPEN:          "open",
  UNSAVED:       "unsaved"
};
