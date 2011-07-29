/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const TAB_CREATION_DELAY = 500;
const UPDATE_STYLESHEET_THROTTLE_DELAY = 1000;


let gChromeWindow; //StyleEditorChrome window


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad);

    gChromeWindow = StyleEditor.openChrome();
    gChromeWindow.addEventListener("load", run, false);
  }, true);

  content.location = TESTCASE_URI;
}

function run()
{
  gChromeWindow.removeEventListener("load", run);

  let SEC = gChromeWindow.styleEditorChrome;
  let document = gChromeWindow.document;

  let list = document.querySelector("#style-editor-styleSheetList");
  let openButton = document.querySelector("#style-editor-openButton");
  let enabledButton = document.querySelector("#style-editor-enabledButton");

  // those buttons are hidden when there is no stylesheet selected
  is(list.selectedIndex, -1, "no stylesheet is initially selected");
  is(openButton.hidden, true,
     "open button is hidden when no stylesheet is selected");
  is(enabledButton.hidden, true,
     "enabled button is hidden when no stylesheet is selected");

  // select first stylesheet, check buttons are now visible
  list.selectedIndex = 0;
  setTimeout(function () {
    is(openButton.hidden, false,
       "open button is visible when a stylesheet is selected");
    is(enabledButton.hidden, false,
       "enabled button is visible when a stylesheet is selected");

    is(SEC.contentDocument.styleSheets[0].disabled, false,
       "selected stylesheet is initially enabled");
    is(enabledButton.checked, true,
       "selected stylesheet is initially enabled, button is checked");

    enabledButton.click(); // toggle stylesheet

    setTimeout(function () {
      is(SEC.contentDocument.styleSheets[0].disabled, true,
         "selected stylesheet is now disabled");
      is(enabledButton.checked, false,
         "selected stylesheet is now disabled, button is unchecked");

      finish();
    }, 1);
  }, 1);
}

