/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

const TAB_CREATION_DELAY = 500;

const NOT_INDENTED = "\nNOT INDENTED";


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

  document.querySelector("#style-editor-newButton").click();
  let editor = SEC.editors[SEC.editors.length - 1];

  setTimeout(function testEditorWindow() {
    let source = "line 1\nline 2\nline 3" + NOT_INDENTED;
    let indentedSource1 = "\tline 1\n\tline 2\n\tline 3" + NOT_INDENTED;
    let indentedSource2 = "\t\tline 1\n\t\tline 2\n\t\tline 3" + NOT_INDENTED;
    let indentedSource3 = "\tline 1\nline 2\nline 3" + NOT_INDENTED;

    editor.inputElement.value = source;
    editor.inputElement.focus();

    // select all but NOT_INDENTED
    editor.inputElement.selectionStart = 0;
    editor.inputElement.selectionEnd =
                       editor.inputElement.value.length - NOT_INDENTED.length;

    EventUtils.synthesizeKey("VK_TAB", {}, editor.window);
    is(editor.inputElement.value, indentedSource1, "Block has been indented");

    is(editor.inputElement.selectionStart, 0, "selectionStart has not changed");
    is(editor.inputElement.selectionEnd,
       editor.inputElement.value.length - NOT_INDENTED.length,
       "selectionEnd has been changed to include tabs");

    EventUtils.synthesizeKey("VK_TAB", {}, editor.window);
    is(editor.inputElement.value, indentedSource2, "Block has been indented again");

    EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, editor.window);
    is(editor.inputElement.value, indentedSource1, "Block has been unindented");

    EventUtils.synthesizeKey("VK_TAB", {shiftKey: true}, editor.window);
    is(editor.inputElement.value, source, "Block has been unindented again");

    editor.inputElement.selectionStart = editor.inputElement.selectionEnd = 0;
    EventUtils.synthesizeKey("VK_TAB", {}, editor.window);
    is(editor.inputElement.value, indentedSource3, "Line 1 has been indented");

    finish();
  }, TAB_CREATION_DELAY);
}
