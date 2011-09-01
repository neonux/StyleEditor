/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/devtools/styleeditor/test/browser/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const NOT_INDENTED = "\nNOT INDENTED";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onContentAttach: run,
      onEditorAdded: function (aChrome, aEditor) {
        if (!aEditor.hasFlag("new")) {
          // we want to test against the new stylesheet we created for this test
          return;
        }

        if (aEditor.sourceEditor) {
          testEditor(aEditor); // already attached to input element
        } else {
          aEditor.addActionListener({
            onAttach: testEditor
          });
        }
      }
    });
    if (aChrome.isContentAttached) {
      run(aChrome);
    }
  });

  content.location = TESTCASE_URI;
}

function run(aChrome) {
  executeSoon(function () {
    waitForFocus(function () {
      // create a new stylesheet for the test
      let newButton = gChromeWindow.document.querySelector(".style-editor-newButton");
      EventUtils.synthesizeMouseAtCenter(newButton, {}, gChromeWindow);
    }, gChromeWindow);
  });
}

function testEditor(aEditor)
{
  let sourceEditorWindow = aEditor.sourceEditor.editorElement.contentWindow
                           || gChromeWindow;
  waitForFocus(function () {
    let lines = ["line 1", "line 2", "line 3"];
    let source = lines.join("\n") + NOT_INDENTED;
    let indentedSource1 = "    " + lines.join("\n    ") + NOT_INDENTED;
    let indentedSource2 = "        " + lines.join("\n        ") + NOT_INDENTED;
    let indentedSourceFirstLine = "    " + lines.join("\n") + NOT_INDENTED;

    aEditor.sourceEditor.setText(source);

    // select all except NOT_INDENTED
    aEditor.sourceEditor.setSelection(0,
      aEditor.sourceEditor.getCharCount() - NOT_INDENTED.length);

    EventUtils.synthesizeKey("VK_TAB", {}, gChromeWindow);
    is(aEditor.sourceEditor.getText(), indentedSource1,
       "Block has been indented");

    is(aEditor.sourceEditor.getSelection().start, 0,
       "selectionStart has not changed");
    is(aEditor.sourceEditor.getSelection().end,
       aEditor.sourceEditor.getCharCount() - NOT_INDENTED.length,
       "selectionEnd has been changed to include new indentation");

    EventUtils.synthesizeKey("VK_TAB", {}, gChromeWindow);
    is(aEditor.sourceEditor.getText(), indentedSource2,
       "Block has been indented again");

    EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, gChromeWindow);
    is(aEditor.sourceEditor.getText(), indentedSource1,
       "Block has been unindented");

    EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, gChromeWindow);
    is(aEditor.sourceEditor.getText(), source,
       "Block has been unindented again");

    aEditor.sourceEditor.setSelection(0, 0);
    EventUtils.synthesizeKey("VK_TAB", {}, gChromeWindow);
    is(aEditor.sourceEditor.getText(), indentedSourceFirstLine,
       "Line 1 has been indented");

    finish();
  }, sourceEditorWindow);
}
