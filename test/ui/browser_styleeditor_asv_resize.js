/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

let gOriginalWidth; // those are set by run() when gChromeWindow is ready
let gOriginalHeight;

function test()
{
  registerCleanupFunction(function resizeToOriginalAndCleanup() {
    if (gOriginalWidth && gOriginalHeight) {
      window.resizeTo(gOriginalWidth, gOriginalHeight);
    }
    cleanup();
  });
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

function run(aChrome)
{
  gOriginalWidth = gChromeWindow.outerWidth;
  gOriginalHeight = gChromeWindow.outerHeight;

  is(aChrome.editors.length, 2,
     "there is 2 stylesheets initially");

  let firstAttach = true;

  aChrome.editors[0].addActionListener({
    onAttach: function onEditorAttached(aEditor) {
      if (firstAttach) {
        aEditor.sourceEditor.setCaretOffset(4);

        // queue a resize to landscape ratio
        // this will trigger a detach and reattach (to workaround bug 254144)
        executeSoon(function () {
          gChromeWindow.resizeTo(800, 400);
        });
        return;
      }

      ok(aEditor.sourceEditor,
         "the editor does reference a SourceEditor again.");
      is(aEditor.sourceEditor.getCaretOffset(), 4,
         "the caret position does not have changed.");

      finish();
    },

    onDetach: function onEditorDetached(aEditor) {
      firstAttach = false;

      is(aEditor.sourceEditor, null,
         "the editor does not reference a SourceEditor in detached state.");
    }
  });
}
