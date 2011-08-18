/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onEditorAdded: run
    });
  });

  content.location = TESTCASE_URI;
}

function run(aChrome, aEditor)
{
  if (aEditor.styleSheetIndex != 0) {
    return; // we want to test against the first stylesheet
  }

  is(aEditor, aChrome.editors[0],
     "stylesheet with index 0 is the first stylesheet listed in the UI");

  let firstStyleSheetEditor = aEditor;
  let firstStyleSheetUI = aChrome.getSummaryElementForEditor(aEditor);

  is(firstStyleSheetEditor.contentDocument.styleSheets[0].disabled, false,
     "first stylesheet is initially enabled");
  is(firstStyleSheetEditor.hasFlag("disabled"), false,
     "first stylesheet is initially enabled, it does not have DISABLED flag");
  is(firstStyleSheetUI.classList.contains("disabled"), false,
     "first stylesheet is initially enabled, UI does not have DISABLED class");

  let disabledToggleCount = 0;
  firstStyleSheetEditor.addActionListener({
    onFlagChange: function (aEditor, aFlagName) {
      if (aFlagName != "disabled") {
        return;
      }
      disabledToggleCount++;

      if (disabledToggleCount == 1) {
        is(firstStyleSheetEditor, aEditor,
           "FlagChange handler triggered for DISABLED flag on the first editor");
        is(firstStyleSheetEditor.styleSheet.disabled, true,
           "first stylesheet is now disabled");
        is(firstStyleSheetEditor.hasFlag("disabled"), true,
           "first stylesheet is now disabled, it has DISABLED flag");
        is(firstStyleSheetUI.classList.contains("disabled"), true,
           "first stylesheet is now disabled, UI has DISABLED class");

        // now toggle it back to enabled
        let enabledToggle = firstStyleSheetUI.querySelector(".stylesheet-enabled");
        EventUtils.sendMouseEvent({type: "click"}, enabledToggle, gChromeWindow);
        return;
      }

      // disabledToggleCount == 2
      is(firstStyleSheetEditor, aEditor,
         "FlagChange handler triggered for DISABLED flag on the first editor (2)");
      is(firstStyleSheetEditor.styleSheet.disabled, false,
         "first stylesheet is now enabled again");
      is(firstStyleSheetEditor.hasFlag("disabled"), false,
         "first stylesheet is now enabled again, it does not have DISABLED flag");
      is(firstStyleSheetUI.classList.contains("disabled"), false,
         "first stylesheet is now enabled again, UI does not have DISABLED class");

      finish();
    }
  });

  let enabledToggle = firstStyleSheetUI.querySelector(".stylesheet-enabled");
  EventUtils.sendMouseEvent({type: "click"}, enabledToggle, gChromeWindow);
}
