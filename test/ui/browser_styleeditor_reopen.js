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
      onEditorAdded: function (aChrome, aEditor) {
        if (aEditor.styleSheetIndex != 0) {
          return; // we want to test against the first stylesheet
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

let gFilename;

function run(aEditor)
{
  gFilename = Components.classes["@mozilla.org/file/directory_service;1"]
               .getService(Components.interfaces.nsIProperties)
               .get("TmpD", Components.interfaces.nsIFile);
  gFilename.append("styleeditor-test.css");
  gFilename.createUnique(gFilename.NORMAL_FILE_TYPE, 0600);

  aEditor.saveToFile(gFilename);

  // insert space so it has the UNSAVED flag
  EventUtils.synthesizeKey("VK_SPACE", {}, aEditor.window);

  let oldChromeWindow = gChromeWindow;
  gChromeWindow.close();

  // open StyleEditorChrome again (a new one since we closed the previous one)
  gChromeWindow = StyleEditor.openChrome();
  ok(gChromeWindow != oldChromeWindow,
     "opening a completely new StyleEditorChrome window");

  gChromeWindow.addEventListener("load", function onChromeLoad() {
    gChromeWindow.removeEventListener("load", onChromeLoad, false);
    gChromeWindow.styleEditorChrome.addChromeListener({
      onEditorAdded: function (aChrome, aEditor) {
        if (aEditor.styleSheetIndex != 0) {
          return; // we want to test against the first stylesheet
        }

        if (aEditor.inputElement) {
          testNewChrome(aEditor); // already attached to input element
        } else {
          aEditor.addActionListener({
            onAttach: testNewChrome
          });
        }
      }
    });
  }, false);
}

function testNewChrome(aEditor)
{
  ok(aEditor.savedFile,
     "first stylesheet editor will save directly into the same file");

  is(aEditor.getFriendlyName(), gFilename.path,
     "first stylesheet still has the filename as it was saved");

  ok(aEditor.hasFlag("unsaved"),
     "first stylesheet still has UNSAVED flag at reopening");

  ok(!aEditor.hasFlag("inline"),
     "first stylesheet does not have INLINE flag (though it is technically inline but that's an implementation detail)");

  finish();
}
