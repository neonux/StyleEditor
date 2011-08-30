/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "four.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onContentAttach: run
    });
    if (aChrome.isContentAttached) {
      run(aChrome);
    }
  });

  content.location = TESTCASE_URI;
}

let gChrome;

function run(aChrome)
{
  gChrome = aChrome;
  aChrome.editors[0].addActionListener({onAttach: onEditor0Attach});
  aChrome.editors[2].addActionListener({onAttach: onEditor2Attach});
}

function getStylesheetNameLinkFor(aEditor)
{
  return gChrome.getSummaryElementForEditor(aEditor).querySelector(".stylesheet-name");
}

function onEditor0Attach(aEditor)
{
  let summary = gChrome.getSummaryElementForEditor(aEditor);
  EventUtils.synthesizeMouse(summary, 10, 1, {}, gChromeWindow);

  waitForFocus(function () {
    let item = getStylesheetNameLinkFor(gChrome.editors[0]);
    ok(gChromeWindow.document.activeElement == item,
       "editor 0 item is the active element");

    EventUtils.synthesizeKey("VK_DOWN", {}, gChromeWindow);
    item = getStylesheetNameLinkFor(gChrome.editors[1]);
    ok(gChromeWindow.document.activeElement == item,
       "editor 1 item is the active element");

    EventUtils.synthesizeKey("VK_HOME", {}, gChromeWindow);
    item = getStylesheetNameLinkFor(gChrome.editors[0]);
    ok(gChromeWindow.document.activeElement == item,
       "fist editor item is the active element");

    EventUtils.synthesizeKey("VK_END", {}, gChromeWindow);
    item = getStylesheetNameLinkFor(gChrome.editors[3]);
    ok(gChromeWindow.document.activeElement == item,
       "last editor item is the active element");

    EventUtils.synthesizeKey("VK_UP", {}, gChromeWindow);
    item = getStylesheetNameLinkFor(gChrome.editors[2]);
    ok(gChromeWindow.document.activeElement == item,
       "editor 2 item is the active element");

    EventUtils.synthesizeKey("VK_RETURN", {}, gChromeWindow);
    // this will attach and give focus editor 2
  }, gChromeWindow);
}

function onEditor2Attach(aEditor)
{
  ok(aEditor.sourceEditor.hasFocus(),
     "editor 2 has focus");

  finish();
}
