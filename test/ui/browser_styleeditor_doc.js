/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TESTCASE_URI = TEST_BASE + "simple.html";

const Ci = Components.interfaces;
const MARGIN_DOC_URL = "https://developer.mozilla.org/en/CSS/margin";


function test()
{
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onEditorAdded: function (aChrome, aEditor) {
        if (aEditor.styleSheetIndex != 0) {
          return; // test with the first style sheet only
        }
        aEditor.addActionListener({onAttach: testEditorAttach});
      }
    });
  });

  content.location = TESTCASE_URI;
}

function testEditorAttach(aEditor)
{
  waitForFocus(function () {
    let originalTabCount = gBrowser.tabs.length;

    aEditor.sourceEditor.setCaretOffset(155); // move cursor in 'margin'
    EventUtils.synthesizeKey("VK_F1", {}, gChromeWindow);

    is(gBrowser.tabs.length, originalTabCount + 1,
       "new tab got opened for documentation");

    let progressListener = {
      onLocationChange: function (aWebProgress, aRequest, aLocation) {
        gBrowser.removeProgressListener(this);

        is(aLocation.spec, MARGIN_DOC_URL,
           "new tab points to documentation of margin property");

        if (gBrowser.tabs.length > 1) {
          gBrowser.removeCurrentTab();
        }
        finish();
      },
      onProgressChange: function () {},
      onSecurityChange: function () {},
      onStateChange: function () {},
      onStatusChange: function () {}
    };

    gBrowser.addProgressListener(progressListener);
    //});
  }, gChromeWindow);
}
