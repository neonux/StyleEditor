/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/devtools/styleeditor/test/browser/";
const TESTCASE_URI = TEST_BASE + "minified.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onEditorAdded: function (aChrome, aEditor) {
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

let editorTestedCount = 0;
function run(aEditor)
{
  if (aEditor.styleSheetIndex == 0) {
    let prettifiedSource = "body{\n\tbackground:white;\n}\n\ndiv{\n\tfont-size:4em;\n\tcolor:red\n}\n";

    is(aEditor.sourceEditor.getText(), prettifiedSource,
       "minified source has been prettified automatically");
    editorTestedCount++;
    let chrome = gChromeWindow.styleEditorChrome;
    let summary = chrome.getSummaryElementForEditor(chrome.editors[1]);
    EventUtils.synthesizeMouseAtCenter(summary, {}, gChromeWindow);
  }

  if (aEditor.styleSheetIndex == 1) {
    let originalSource = "body { background: red; }\ndiv {\nfont-size: 5em;\ncolor: red\n}";
    is(aEditor.sourceEditor.getText(), originalSource,
       "non-minified source has been left untouched");
    editorTestedCount++;
  }

  if (editorTestedCount == 2) {
    finish();
  }
}
