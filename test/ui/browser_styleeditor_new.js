/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const TAB_CREATION_DELAY = 500;
const UPDATE_STYLESHEET_THROTTLE_DELAY = 1000;


let gChromeWindow; //StyleEditorChrome window


function cleanup()
{
  gChromeWindow.close();
  gChromeWindow = null;
  gBrowser.removeCurrentTab();
}

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

  let countBeforeNew = SEC.editors.length;

  // create a new style sheet
  let newButton = document.querySelector("#style-editor-newButton");
  newButton.click();

  is(SEC.editors.length, countBeforeNew + 1,
     "new style sheet added one more editor");
  let newEditor = SEC.editors[SEC.editors.length - 1];
  ok(newEditor, "got the new editor instance");

  setTimeout(function testNewEditorWindow() {
    let gotLoadEvent;
    newEditor.addActionListener({
      onLoad: function () {
        gotLoadEvent = true;
      }
    });

    ok(gotLoadEvent, "load event got fired to new action listener");

    ok(newEditor.inputElement, "editor is opened and input element attached");

    let focused = newEditor.window.document.commandDispatcher.focusedElement;
    ok(focused, "editor has focus");

    //FIXME: should rather use EventUtils.sendString but it depends on jQuery!?
    newEditor.inputElement.value = "body{background-color:red;}";
    newEditor.updateStyleSheet();

    setTimeout(function checkComputedStyle() {
      let computedStyle = content.getComputedStyle(content.document.body, null);
      is(computedStyle.backgroundColor, "rgb(255, 0, 0)",
         "background color has been updated to red");

      finish();
    }, UPDATE_STYLESHEET_THROTTLE_DELAY);
  }, TAB_CREATION_DELAY);
}
