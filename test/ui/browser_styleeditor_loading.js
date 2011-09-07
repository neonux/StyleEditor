/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "https://example.com/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();

  // launch Style Editor right when the tab is created (before load)
  launchStyleEditorChrome(function (aChrome) {
    isnot(gBrowser.selectedBrowser.contentWindow.document.readyState, "complete",
           "content document is loading");

    aChrome.addChromeListener({
      onContentAttach: run
    });
  });

  content.location = TESTCASE_URI;
}

function run(aChrome)
{
  is(aChrome.contentWindow.document.readyState, "complete",
     "content document is complete");

  finish();
}