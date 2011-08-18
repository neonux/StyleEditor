/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const NOT_INDENTED = "\nNOT INDENTED";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onContentAttach: function (aChrome) {
        // create a new stylesheet for the test
        let document = gChromeWindow.document;
        document.querySelector(".style-editor-newButton").click();
      },
      onEditorAdded: function (aChrome, aEditor) {
        if (!aEditor.hasFlag("new")) {
          // we want to test against the new stylesheet we created for this test
          return;
        }
        if (aEditor.inputElement) {
          run(aEditor); // already attached to input element
        } else {
          aEditor.addActionListener({
            onAttach: run
          });
        }
      }
    });
  });

  content.location = TESTCASE_URI;
}

function run(aEditor)
{
  let source = "line 1\nline 2\nline 3" + NOT_INDENTED;
  let indentedSource1 = "\tline 1\n\tline 2\n\tline 3" + NOT_INDENTED;
  let indentedSource2 = "\t\tline 1\n\t\tline 2\n\t\tline 3" + NOT_INDENTED;
  let indentedSource3 = "\tline 1\nline 2\nline 3" + NOT_INDENTED;

  aEditor.inputElement.value = source;
  aEditor.inputElement.focus();

  // select all but NOT_INDENTED
  aEditor.inputElement.selectionStart = 0;
  aEditor.inputElement.selectionEnd =
    aEditor.inputElement.value.length - NOT_INDENTED.length;

  EventUtils.synthesizeKey("VK_TAB", {}, aEditor.window);
  is(aEditor.inputElement.value, indentedSource1, "Block has been indented");

  is(aEditor.inputElement.selectionStart, 0, "selectionStart has not changed");
  is(aEditor.inputElement.selectionEnd,
     aEditor.inputElement.value.length - NOT_INDENTED.length,
     "selectionEnd has been changed to include tabs");

  EventUtils.synthesizeKey("VK_TAB", {}, aEditor.window);
  is(aEditor.inputElement.value, indentedSource2, "Block has been indented again");

  EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, aEditor.window);
  is(aEditor.inputElement.value, indentedSource1, "Block has been unindented");

  EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, aEditor.window);
  is(aEditor.inputElement.value, source, "Block has been unindented again");

  aEditor.inputElement.selectionStart = aEditor.inputElement.selectionEnd = 0;
  EventUtils.synthesizeKey("VK_TAB", {}, aEditor.window);
  is(aEditor.inputElement.value, indentedSource3, "Line 1 has been indented");

  finish();
}
