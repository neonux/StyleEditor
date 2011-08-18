/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.addTab(); // because we'll close the next one
  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    let editorAddedCount = 0;
    aChrome.addChromeListener({
      onEditorAdded: function continueWhenAllAreLoaded(aChrome, aEditor) {
        editorAddedCount++;

        if (editorAddedCount == aChrome.editors.length) {
          // all editors have been loaded, close the content tab
          gBrowser.removeCurrentTab();
        }
      },

      onContentDetach: function (aChrome) {
        // check that the UI has switched to read-only
        run(aChrome);
      }
    });
  });

  content.location = TESTCASE_URI;
}

function run(aChrome)
{
  let document = gChromeWindow.document;
  let disabledCount;
  let elements;

  disabledCount = 0;
  elements = document.querySelectorAll("button,input,select");
  for (let i = 0; i < elements.length; ++i) {
    if (elements[i].hasAttribute("disabled")) {
      disabledCount++;
    }
  }
  ok(elements.length && disabledCount == elements.length,
     "all buttons, input and select elements are disabled");

  disabledCount = 0;
  elements = document.querySelectorAll("textarea,textbox");
  for (let i = 0; i < elements.length; ++i) {
    if (elements[i].hasAttribute("readonly")) {
      disabledCount++;
    }
  }
  ok(elements.length && disabledCount == elements.length,
     "all textarea and textbox elements are read-only");

  finish();
}
