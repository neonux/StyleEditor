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
      onContentAttach: run,
      onEditorAdded: testEditorAdded
    });
    if (aChrome.isContentAttached) {
      run(aChrome);
    }
  });

  content.location = TESTCASE_URI;
}

let gInitialStyleSheetCount= 0;

function run(aChrome)
{
  let document = gChromeWindow.document;

  gInitialStyleSheetCount = aChrome.editors.length;

  // create a new style sheet
  let newButton = document.querySelector(".style-editor-newButton");
  newButton.click();
}

let gNewEditor;
function testEditorAdded(aChrome, aEditor)
{
  if (aEditor.styleSheetIndex != gInitialStyleSheetCount) {
    return; // this is not the new stylesheet
  }

  ok(!gNewEditor, "creating a new stylesheet triggers one EditorAdded event");
  gNewEditor = aEditor; // above test will fail if we get a duplicate event

  is(aChrome.editors.length, gInitialStyleSheetCount + 1,
     "creating a new stylesheet added a new StyleEditor instance");

  let listener = {
    onAttach: function (aEditor) {
      ok(aEditor.isLoaded,
         "new editor is loaded when attached");
      ok(aEditor.hasFlag("new"),
         "new editor has NEW flag");
      ok(!aEditor.hasFlag("unsaved"),
         "new editor does not have UNSAVED flag");

      ok(aEditor.inputElement,
         "new editor has an input element attached");
      ok(gChromeWindow.document.activeElement = aEditor.inputElement,
         "new editor has focus");

      let summary = aChrome.getSummaryElementForEditor(aEditor);
      let ruleCount = summary.querySelector(".stylesheet-rule-count").textContent;
      is(parseInt(ruleCount), 0,
         "new editor initially shows 0 rules");

      let computedStyle = content.getComputedStyle(content.document.body, null);
      is(computedStyle.backgroundColor, "rgb(255, 255, 255)",
         "content's background color is initially white");

      EventUtils.sendString("body{background-color:red;}", aEditor.inputElement);
    },

    onCommit: function (aEditor) {
      ok(aEditor.hasFlag("new"),
         "new editor still has NEW flag");
      ok(aEditor.hasFlag("unsaved"),
         "new editor has UNSAVED flag after modification");

      let summary = aChrome.getSummaryElementForEditor(aEditor);
      let ruleCount = summary.querySelector(".stylesheet-rule-count").textContent;
      is(parseInt(ruleCount), 1,
         "new editor shows 1 rule after modification");

      let computedStyle = content.getComputedStyle(content.document.body, null);
      is(computedStyle.backgroundColor, "rgb(255, 0, 0)",
         "content's background color has been updated to red");

      finish();
    }
  };
  aEditor.addActionListener(listener);
  if (aEditor.inputElement) {
    listener.onAttach(aEditor);
  }
}
