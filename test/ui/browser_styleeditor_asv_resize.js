/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TESTCASE_URI = TEST_BASE + "simple.html";

let gOriginalWidth; // these are set by run() when gChromeWindow is ready
let gOriginalHeight;

function test()
{
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

  let attachCount = 0;

  aChrome.editors[0].addActionListener({
    onAttach: function onEditorAttached(aEditor) {
      attachCount++;

      if (attachCount == 1) {
        aEditor.sourceEditor.setCaretOffset(4); // to check the caret is preserved

        // queue a resize to inverse aspect ratio
        // this will trigger a detach and reattach (to workaround bug 254144)
        executeSoon(function () {
          waitForFocus(function () {
            gChromeWindow.resizeTo(120, 480);
          }, gChromeWindow);
        });
      } else {
        ok(aEditor.sourceEditor,
           "the editor does reference a SourceEditor again.");
        is(aEditor.sourceEditor.getCaretOffset(), 4,
           "the caret position has been preserved.");

        if (attachCount == 2) {
          // queue a resize to original aspect ratio
          // this will trigger a detach and reattach (to workaround bug 254144)
          executeSoon(function () {
            waitForFocus(function () {
              gChromeWindow.resizeTo(gOriginalWidth, gOriginalHeight);
            }, gChromeWindow);
          });
        }
      }
    },

    onDetach: function onEditorDetached(aEditor) {
      if (attachCount == 1) {
        is(aEditor.sourceEditor, null,
           "the editor does not reference a SourceEditor in detached state.");
      } else {
        finish();
      }
    }
  });
}
