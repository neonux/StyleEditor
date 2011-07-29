/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const TAB_CREATION_DELAY = 500;

let gChromeWindow; //StyleEditorChrome window


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.addTab(); // because we'll close the next ones
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

  // check that the stylesheet list is enabled
  let listBox = document.querySelector("richlistbox");
  is(listBox.disabled, false, "stylesheet list is initially enabled");

  document.querySelector("#style-editor-newButton").click();
  let editor = SEC.editors[SEC.editors.length - 1];

  setTimeout(function testEditorWindow() {
    ok(!editor.inputElement.getAttribute("readonly"),
       "editor is not read-only initially");

    gBrowser.removeCurrentTab();

    is(editor.inputElement.getAttribute("readonly"), "true",
       "editor is read-only after content has been closed");

    is(listBox.disabled, true,
       "stylesheet list is disabled after contnet has been closed");

    finish();
  }, TAB_CREATION_DELAY);
}

