/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";


let gChromeWindow; //StyleEditorChrome window


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad, false);

    gChromeWindow = StyleEditor.openChrome();
    gChromeWindow.addEventListener("load", run, false);
  }, true);

  content.location = TESTCASE_URI;
}

function run()
{
  gChromeWindow.removeEventListener("load", run, false);

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

  let gotLoadEvent;

  newEditor.addActionListener({
    onLoad: function () {
      gotLoadEvent = true;
    },

    onAttach: function () {
      ok(gotLoadEvent, "load event got fired to new action listener");

      ok(newEditor.inputElement, "editor is opened and input element attached");

      executeSoon(function () {
        let focused = newEditor.window.document.commandDispatcher.focusedElement;
        ok(focused, "editor has focus");

        //FIXME: should rather use EventUtils.sendString but it depends on jQuery!?
        newEditor.inputElement.value = "body{background-color:red;}";
        newEditor.updateStyleSheet();
      });
    },

    onCommit: function () {
      let computedStyle = content.getComputedStyle(content.document.body, null);
      is(computedStyle.backgroundColor, "rgb(255, 0, 0)",
         "background color has been updated to red");

      finish();
    }
  });
}
