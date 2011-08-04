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

const EXPORTED_SYMBOLS = ["AdaptiveSplitView"];

/* these must be kept in sync with CSS */
const LANDSCAPE_MEDIA_QUERY = "(min-aspect-ratio: 16/9)";

const BINDING_USERDATA = "splitview-binding";


/**
 * AdaptiveSplitView constructor
 *
 * Initialize the adaptive split view UI on an existing DOM element.
 *
 * A split view organizes content with a summary list and a details view on the
 * side for the active/selected summary.
 * It is adaptive as it shows details on the side or inside the list depending
 * on the aspect ratio of the UI.
 *
 * @param DOMElement aRoot
 */
function AdaptiveSplitView(aRoot)
{
  this._root = aRoot;
  this._controller = aRoot.querySelector(".splitview-controller");
  this._nav = aRoot.querySelector(".splitview-nav");
  this._side = aRoot.querySelector(".splitview-side-details");
  this._activeSummary = null

  this._mql = aRoot.ownerDocument.defaultView.matchMedia(LANDSCAPE_MEDIA_QUERY);
  this._mql.addListener(this._onOrientationChange.bind(this));

  this._filter = aRoot.querySelector("input.splitview-filter");
  if (this._filter) {
    this._filter.search = function onFilterInput(evt) {
      this.filterContentBy(this._filter.value);
    }.bind(this);
    this._filter.addEventListener("input", this._filter.search, false);
    this._filter.addEventListener("keyup", function onFilterKeyUp(aEvent) {
      if (aEvent.keyCode == aEvent.DOM_VK_ENTER
          || aEvent.keyCode == aEvent.DOM_VK_RETURN) {
        // autofocus matching content if there is only one
        let matches = this._nav.querySelectorAll("* > li:not(.splitview-filtered)");
        if (matches.length == 1) {
          this.activeSummary = matches[0];
        }
      }
    }.bind(this), false);
  }

  this._nav.addEventListener("keydown", function onKeyCatchAll(aEvent) {
    function findFocusedElementIn(container) {
      let el = container.querySelector("*:focus");
      while (el && el.parentNode != container) {
        el = el.parentNode;
      }
      return el || container;
    }

    if (aEvent.target.tagName == "INPUT"
        || aEvent.target.tagName == "TEXTAREA") {
      return; //TODO: more generic default handling
    }

    // handle keyboard navigation
    let focusNavDest;
    if (aEvent.keyCode == aEvent.DOM_VK_PAGE_UP
        || aEvent.keyCode == aEvent.DOM_VK_HOME) {
      focusNavDest = this._nav.firstChild;
    } else if (aEvent.keyCode == aEvent.DOM_VK_PAGE_DOWN
               || aEvent.keyCode == aEvent.DOM_VK_END) {
      focusNavDest = this._nav.lastChild;
    } else if (aEvent.keyCode == aEvent.DOM_VK_UP) {
      focusNavDest = findFocusedElementIn(this._nav).previousElementSibling
                     || this._nav.firstChild;
    } else if (aEvent.keyCode == aEvent.DOM_VK_DOWN) {
      focusNavDest = findFocusedElementIn(this._nav).nextElementSibling
                     || this._nav.lastChild;
    }

    if (focusNavDest) {
      aEvent.stopPropagation();
      if (!focusNavDest.tabIndex) {
        focusNavDest = focusNavDest.querySelector("a");
      }
      focusNavDest.focus();
      return false;
    }

    // handle search-on-type auto-focus
    if (this._filter) {
      let isChar = String.fromCharCode(aEvent.which).trim().length;
      if (isChar) {
        this._filter.focus();
      }
    }
  }.bind(this), false);
}

AdaptiveSplitView.prototype = {
  /**
    * Retrieve whether the UI currently has a landscape orientation.
    *
    * @return boolean
    */
  get isLandscape() this._mql.matches,

  /**
    * Retrieve the root element.
    *
    * @return DOMElement
    */
  get rootElement() this._root,

  /**
    * Retrieve the active summary element or null if there is none.
    *
    * @return DOMElement
    */
  get activeSummary() this._activeSummary,

  /**
    * Set the active summary element.
    *
    * @param DOMElement aSummary
    */
  set activeSummary(aSummary)
  {
    if (aSummary == this._activeSummary) {
      return;
    }

    if (this._activeSummary) {
      let binding = this._activeSummary.getUserData(BINDING_USERDATA);
      removeClass(this._activeSummary, "splitview-active");
      removeClass(binding._details, "splitview-active");

      if (binding.onHide) {
        binding.onHide(this._activeSummary, binding._details, binding.data);
      }
    }

    if (!aSummary) {
      return;
    }

    let binding = aSummary.getUserData(BINDING_USERDATA);
    addClass(aSummary, "splitview-active");
    addClass(binding._details, "splitview-active");

    this._activeSummary = aSummary;

    if (binding.onShow) {
      binding.onShow(aSummary, binding._details, binding.data);
    }

    if (!this.isLandscape) {
      scheduleAnimation(aSummary, "splitview-slide");
    }
    aSummary.scrollIntoView();
  },

  /**
    * Retrieve the active details element or null if there is none.
    * @return DOMElement
    */
  get activeDetails()
  {
    let summary = this.activeSummary;
    if (!summary) {
      return null;
    }
    return summary.getUserData(BINDING_USERDATA)._details;
  },

  /**
   * Append new content to the split view.
   *
   * @param string aName
   *        Name of the template elements to instantiate.
   *        There must be two elements with id "splitview-tpl-summary-" and
   *        "splitview-tpl-details-" suffixed with 'name'.
   *
   * @param object aOptions
   *     Optional object that defines custom behavior and data for the content.
   *     All properties are optional :
   *     - function(DOMElement summary, DOMElement details, object data) onCreate
   *         Called when the content has been added.
   *     - function(summary, details, data) onShow
   *         Called when the content is shown (active).
   *     - function(summary, details, data) onHide
   *         Called when the content is hidden (not active anymore).
   *     - function(summary, details, data) onDestroy
   *         Called when the content has been removed.
   *     - function(summary, details, data, query) onFilterBy
   *         Called when the user performs a filtering search.
   *         If the function returns false, the content does not match query
   *         string and will be hidden.
   *     - object data
   *         Object to pass to the callbacks above.
   *     - boolean disableAnimations
   *         If true there is no animation or scrolling when this content is
   *         appended. Set this when batch appending (eg. initial population).
   *     - number ordinal
   *         Content with a lower ordinal is displayed before those with a
   *         higher ordinal.
   *
   * @return tuple{summary:,details:}
   *         A tuple with the new DOM elements created for summary and details.
   */
  appendContent: function ASV_appendContent(aName, aOptions)
  {
    let binding = aOptions || {};
    let summary = this._root.querySelector("#splitview-tpl-summary-" + aName);
    let details = this._root.querySelector("#splitview-tpl-details-" + aName);

    summary = summary.cloneNode(true);
    summary.id = "";
    if (binding.ordinal !== undefined) { // can be zero
      summary.style.MozBoxOrdinalGroup = binding.ordinal;
    }
    details = details.cloneNode(true);
    details.id = "";

    binding._summary = summary;
    binding._details = details;
    summary.setUserData(BINDING_USERDATA, binding, null);

    if (!binding.disableAnimations) {
      scheduleAnimation(summary, "splitview-slide", "splitview-flash");
    }
    this._nav.appendChild(summary);

    summary.addEventListener("click", function onSummaryClick(evt) {
      evt.stopPropagation();
      this.activeSummary = summary;
    }.bind(this), false);

    let detailsContainer = (this.isLandscape)
                           ? this._side
                           : summary.querySelector(".splitview-inline-details");
    detailsContainer.appendChild(details);

    if (binding.onCreate) {
      binding.onCreate(summary, details, binding.data);
    }

    if (!binding.disableAnimations) {
      summary.scrollIntoView();
    }

    return {
      summary: summary,
      details: details
    };
  },

  /**
    * Remove content from the split view.
    *
    * @param DOMElement aSummary
    */
  removeContent: function ASV_removeContent(aSummary)
  {
    if (aSummary == this._activeSummary) {
      this.activeSummary = null;
    }

    let binding = aSummary.getUserData(BINDING_USERDATA);
    aSummary.parentNode.removeChild(aSummary);
    binding._details.parentNode.removeChild(binding._details);

    if (binding.onDestroy) {
      binding.onDestroy(aSummary, binding._details, binding.data);
    }
  },

  /**
   * Remove all content from the split view.
   */
  removeAll: function ASV_removeAll()
  {
    for (let i = 0; i < this._nav.children.length; ++i) {
      this.removeContent(this._nav.children[i]);
    }
  },

  /**
    * Filter content by given string.
    * Matching is performed on every content by calling onFilterBy when defined
    * and then by searching aQuery in the summary element's text content.
    * Non-matching content is hidden.
    *
    * @param string aQuery
    *        The query string. Use null to reset (no filter).
    * @return number
    *         The number of filtered (non-matching) content.
    */
  filterContentBy: function ASV_filterContentBy(aQuery)
  {
    if (!this._nav.children.length) {
      return 0;
    }
    if (aQuery) {
      aQuery = aQuery.trim();
    }
    if (!aQuery) {
      for (let i = 0; i < this._nav.children.length; ++i) {
        removeClass(this._nav.children[i], "splitview-filtered");
      }
      removeClass(this._filter, "splitview-all-filtered");
      removeClass(this._nav, "splitview-all-filtered");
      return 0;
    }

    let count = 0;
    let filteredCount = 0;
    for (let i = 0; i < this._nav.children.length; ++i) {
      let summary = this._nav.children[i];

      let matches = false;
      let binding = summary.getUserData(BINDING_USERDATA);
      if (binding.onFilterBy) {
        matches = binding.onFilterBy(summary, binding._details, binding.data, aQuery);
      }
      if (!matches) { // try text content
        matches = (summary.textContent.indexOf(aQuery) > -1);
      }

      count++;
      if (!matches) {
        addClass(summary, "splitview-filtered");
        filteredCount++;
      } else {
        removeClass(summary, "splitview-filtered");
      }
    }

    if (count > 0 && filteredCount == count) {
      addClass(this._filter, "splitview-all-filtered");
      addClass(this._nav, "splitview-all-filtered");
    } else {
      removeClass(this._filter, "splitview-all-filtered");
      removeClass(this._nav, "splitview-all-filtered");
    }
    return filteredCount;
  },

  /**
   * Iterates every available content in the view.
   * Iteration stops if aCallback returns true.
   *
   * @param function aCallback(aSummary, aDetails, aData)
   */
  forEachContent: function ASV_forEachContent(aCallback)
  {
    for (let i = 0; i < this._nav.children.length; ++i) {
      let binding = this._nav.children[i].getUserData(BINDING_USERDATA);
      if (binding
          && aCallback(binding._summary, binding._details, binding.data)) {
        return;
      }
    }
  },

  /**
   * Set the content's CSS class name.
   * This sets the class on both the summary and details elements, with respect
   * to any AdaptiveSplitView specific classes.
   *
   * @param DOMElement aSummary
   *        Summary element for the content to set.
   * @param string className
   *        One or more space-separated CSS classes.
   */
  setContentClassName: function ASV_setContentClassName(aSummary, className)
  {
    let binding = aSummary.getUserData(BINDING_USERDATA);
    let backup;

    backup = aSummary.className.match(/(splitview\-[\w-]+)/);
    backup = backup ? backup.slice(1).join(" ") : "";
    aSummary.className = backup + " " + className;

    backup = binding._details.className.match(/(splitview\-[\w-]+)/);
    backup = backup ? backup.slice(1).join(" ") : "";
    binding._details.className = backup + " " + className;
  },

  /**
   * Called by media query listener when orientation changes.
   */
  _onOrientationChange: function ASV__onOrientationChange()
  {
    for (let i = 0; i < this._nav.children.length; ++i) {
      let summary = this._nav.children[i];
      let detailsContainer = (this.isLandscape)
                             ? this._side
                             : summary.querySelector(".splitview-inline-details");
      let binding = summary.getUserData(BINDING_USERDATA);
      detailsContainer.appendChild(binding._details);

      // we are re-showing details
      if (binding.onShow) {
        binding.onShow(summary, binding._details, binding.data);
      }
    }
  }
};


//
// private helpers

/**
  * Assert that an expression is true, throw an exception otherwise.
  *
  * @param boolean aExpression
  * @param string aMessage
  *        Optional message for the exception.
  */
function assert(aExpression, aMessage)
{
  if (!aExpression) {
    throw new Error("Assertion failed!\n" + aMessage);
  }
}

/**
 * Add one or multiple CSS class(es) to an element.
 *
 * @param DOMElement aElement
 * @param string ...
 *        One or multiple class name(s).
 */
function addClass(aElement)
{
  assert(arguments.length > 1);

  let args = Array.prototype.slice.call(arguments, 1);
  let toAdd = args.join(" ");
  aElement.className += " " + toAdd;
}

/**
 * Remove one or multiple CSS class(es) from an element.
 *
 * @param DOMElement aElement
 * @param string ...
 *        One or multiple class name(s).
 */
function removeClass(aElement)
{
  assert(arguments.length > 1);

  let args = Array.prototype.slice.call(arguments, 1);
  for (let i = 0; i < args.length; ++i) {
    aElement.className = aElement.className.replace(args[i], "");
  }
}

/**
 * Schedule one or multiple CSS animation(s) on an element.
 *
 * @param DOMElement aElement
 * @param string ...
 *        One or multiple animation class name(s).
 */
function scheduleAnimation(aElement, aClass)
{
  assert(arguments.length > 1);

  let args = [aElement].concat(Array.prototype.slice.call(arguments, 1));
  addClass.apply(null, args);
  let window = aElement.ownerDocument.defaultView;
  window.mozRequestAnimationFrame(function triggerAnimation() {
    window.setTimeout(function () {
      removeClass.apply(null, args);
    }, 10);
  });
}

