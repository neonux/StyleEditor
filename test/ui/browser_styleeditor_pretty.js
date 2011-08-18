/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "minified.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onEditorAdded: function (aChrome, aEditor) {
        if (aEditor.inputElement) {
          run(aEditor); // already attached to input element
        } else {
          aEditor.addActionListener({
            onAttach: run
          });
        }

        // make sure to activate the editor if needed (lazy attach)
        aChrome.getSummaryElementForEditor(aEditor).click();
      }
    });
  });

  content.location = TESTCASE_URI;
}

let editorTestedCount = 0;
function run(aEditor)
{
  if (aEditor.styleSheetIndex == 0) {
    let prettifiedSource = "body{\n\tbackground:white;\n}\n\ndiv{\n\tfont-size:4em;\n\tcolor:red\n}\n";

    is(aEditor.inputElement.value, prettifiedSource,
       "minified source has been prettified automatically");
    editorTestedCount++;
  }

  if (aEditor.styleSheetIndex == 1) {
    let originalSource = "body { background: red; }\ndiv {\nfont-size: 5em;\ncolor: red\n}";
    is(aEditor.inputElement.value, originalSource,
       "non-minified source has been left untouched");
    editorTestedCount++;
  }

  if (editorTestedCount == 2) {
    finish();
  }
}
