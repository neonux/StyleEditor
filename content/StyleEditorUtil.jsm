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

const EXPORTED_SYMBOLS = [
  "_",
  "assert",
  "attr",
  "getCurrentBrowserTabContentWindow",
  "getDocumentForElement",
  "getNodeAsJSON",
  "isShadowStyleSheet",
  "log",
  "wire"
];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

const PROPERTIES_URL = "chrome://StyleEditor/locale/StyleEditor.properties";

const console = Services.console;
const gStringBundle = Services.strings.createBundle(PROPERTIES_URL);


/**
 * Returns a localized string with the given key name from the string bundle.
 *
 * @param aName
 * @param ...rest
 *        Optional arguments to format in the string.
 * @return string
 */
function _(aName)
{

  if (arguments.length == 1) {
    return gStringBundle.GetStringFromName(aName);
  }
  let rest = Array.prototype.slice.call(arguments, 1);
  return gStringBundle.formatStringFromName(aName, rest, rest.length);
}

/**
 * Assert an expression is true or throw if false.
 *
 * @param aExpression
 * @param aMessage
 *        Optional message.
 * @return aExpression
 */
function assert(aExpression, aMessage)
{
  if (!!!(aExpression)) {
    let msg = aMessage ? "ASSERTION FAILURE:" + aMessage : "ASSERTION FAILURE";
    log(msg);
    throw new Error(msg);
  }
  return aExpression;
}

/**
 * Retrieve or set the attribute value of an element.
 *
 * @param DOMElement aRoot
 *        The element to use for querySelector.
 * @param string aSelector
 *        Selector string for the element to set the attribute to.
 *        If there is no match, the call is ignored and returns null.
 * @param string aName
 *        The name of the attribute to set.
 * @param string aValue
 *        Optional value of the attribute.
 * @return object
 *         The value of the attribute, or null if the attribute does not exist.
 */
function attr(aRoot, aSelector, aName, aValue)
{
  let element = aRoot.querySelector(aSelector);
  if (!element) {
    return null;
  }

  if (aValue === undefined) {
    return element.getAttribute(aName);
  }
  element.setAttribute(aName, aValue);
  return aValue;
}

/**
 * Iterates _own_ properties of an object.
 *
 * @param aObject
 *        The object to iterate. If falsy the function returns immediately.
 * @param function aCallback(aKey, aValue)
 */
function forEach(aObject, aCallback)
{
  for (let key in aObject) {
    if (aObject.hasOwnProperty(key)) {
      aCallback(key, aObject[key]);
    }
  }
}

/**
 * Retrieve the content window for currently selected browser tab.
 *
 * @return DOMWindow
 */
function getCurrentBrowserTabContentWindow() {
  let mostRecentWindow = Services.wm.getMostRecentWindow("navigator:browser");
  return mostRecentWindow.gBrowser.selectedBrowser.contentWindow;
}

/**
 * Retrieve the root DOMDocument that owns a DOMElement.
 *
 * @param DOMElement aElement
 * @return DOMDocument
 */
function getDocumentForElement(aElement)
{
  while (aElement.parentNode) {
    aElement = aElement.parentNode;
  }
  return aElement;
}

/**
 * Retrieve a JSON representation for a source node or a change node.
 *
 * @param Node aNode
 * @return string
 */
function getNodeAsJSON(aNode)
{
  return JSON.stringify(aNode, function filterNodeLinks(key, value) {
    switch (key) {
    case "prev":
    case "next":
      return undefined;
    }
    return value;
  }, 4);
}

/**
 * Return true if the a style sheet is a 'shadow style sheet'.
 *
 * @param DOMStyleSheet aStyleSHeet
 * @return boolean
 * @see StyleEditor._setupShadowStyleSheet
 */
function isShadowStyleSheet(aStyleSheet)
{
  return aStyleSheet
         && aStyleSheet.ownerNode
         && aStyleSheet.ownerNode.getAttribute("data-style-editor-managed");
}

/**
 * Log a message to the console.
 * 
 * @param ...rest
 *        One or multiple arguments to log.
 *        If multiple arguments are given, they will be joined by " " in the log.
 */
function log()
{
  console.logStringMessage(Array.prototype.slice.call(arguments).join(" "));
}

/**
 * Wire up element matching selector with attribute,s event listeners, etc.
 *
 * @param DOMElement aRoot
 *        The element to use for querySelector.
 *        Can be null if aSelector is a DOMElement.
 * @param aSelector
 *        Selector string or DOMElement for the element to wire up.
 * @param aDescriptor
 *        An object describing how to wire matching selector, supported properties
 *        are "events", "attributes" and "userData" taking objects themselves.
 *        Each key of properties above represents the name of the event, attribute
 *        or userData, with the value an function to use as the event handler,
 *        string to use as attribute value, or object to use as named userData
 *        respectively.
 *        If aDescriptor is a function, the argument is equivalent to :
 *        {events: {'command': aDescriptor}}
 * @return DOMElement
 *         The element that has been been wired up, or null if there were no
 *         element matching aSelector.
 */
function wire(aRoot, aSelector, aDescriptor)
{
  let element = aSelector;
  if (typeof(aSelector) == "string") {
    element = aRoot.querySelector(aSelector);
    if (!element) {
      return null;
    }
  }

  if (typeof(aDescriptor) == "function") {
    aDescriptor = {events: {'command': aDescriptor}};
  }

  forEach(aDescriptor.events, function (aName, aHandler) {
    element.addEventListener(aName, aHandler, false);
  });
  forEach(aDescriptor.attributes, element.setAttribute);
  forEach(aDescriptor.userData, element.setUserData);

  return element;
}

