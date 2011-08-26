/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

// http rather than chrome to improve coverage
const TEST_BASE = "http://example.com/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

Components.utils.import("resource://gre/modules/FileUtils.jsm");


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

        if (aEditor.sourceEditor) {
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

let gWindowListener = {
  onCloseWindow: function () {
    Services.wm.removeListener(gWindowListener);

    waitForFocus(function () {
      // wait that browser has focus again
      // open StyleEditorChrome again (a new one since we closed the previous one)
      launchStyleEditorChrome(function (aChrome) {
        ok(gChromeWindow != gOldChromeWindow,
           "opened a completely new StyleEditorChrome window");
        gOldChromeWindow = null;

        aChrome.addChromeListener({
          onEditorAdded: function (aChrome, aEditor) {
            if (aEditor.styleSheetIndex != 0) {
              return; // we want to test against the first stylesheet
            }

            if (aEditor.sourceEditor) {
              testNewChrome(aEditor); // already attached to input element
            } else {
              aEditor.addActionListener({
                onAttach: testNewChrome
              });
            }
          }
        });
      });
    });
  }
};

let gFilename;

function run(aEditor)
{
  gFilename = FileUtils.getFile("ProfD", ["styleeditor-test.css"])

  aEditor.saveToFile(gFilename);

  is(aEditor.getFriendlyName(), gFilename.leafName,
     "stylesheet's friendly name has its saved filename");

  let sourceEditorWindow = aEditor.sourceEditor.editorElement.contentWindow
                           || gChromeWindow;
  waitForFocus(function () {
    // insert char so that this stylesheet has the UNSAVED flag
    EventUtils.synthesizeKey("x", {}, gChromeWindow);

    gOldChromeWindow = gChromeWindow;
    Services.wm.addListener(gWindowListener);
    gChromeWindow.close();
  }, sourceEditorWindow);
}

function testNewChrome(aEditor)
{
  ok(aEditor.savedFile,
     "first stylesheet editor will save directly into the same file");

  is(aEditor.getFriendlyName(), gFilename.leafName,
     "first stylesheet still has the filename as it was saved");

  ok(aEditor.hasFlag("unsaved"),
     "first stylesheet still has UNSAVED flag at reopening");

  ok(!aEditor.hasFlag("inline"),
     "first stylesheet does not have INLINE flag (though it is technically inline but that's an implementation detail)");

  ok(!aEditor.hasFlag("error"),
     "editor does not have error flag initially");
  aEditor.saveToFile("Z:\\I_DO_NOT_EXIST_42\\bogus.css");
  ok(aEditor.hasFlag("error"),
     "editor has error flag after attempting to save with invalid path");

  finish();
}
