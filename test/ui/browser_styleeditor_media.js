/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "media.html";


let gBrowserWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator)
                       .getMostRecentWindow("navigator:browser");
let gOriginalWidth = gBrowserWindow.outerWidth;
let gOriginalHeight = gBrowserWindow.outerHeight;

let gChromeWindow; //StyleEditorChrome window


function test()
{
  registerCleanupFunction(function cleanupAndRestoreSize() {
    cleanup();
    gBrowserWindow.resizeTo(gOriginalWidth, gOriginalHeight);
  });
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad, false);

    gChromeWindow = StyleEditor.openChrome();
    gChromeWindow.addEventListener("load", run, false);
  }, true);

  content.location = TESTCASE_URI;
}

function run()
{
  gChromeWindow.removeEventListener("load", run, false);

  let SEC = gChromeWindow.styleEditorChrome;
  let document = gChromeWindow.document;

  let list = document.querySelector("#style-editor-styleSheetList");
  let medias;

  media = list.children[0].querySelectorAll(".stylesheet-media");
  is(media.length, 2, "first stylesheet has 2 media");
  is(media[0].value, "screen", "first stylesheet's first media is screen");
  is(media[0].disabled, false, "first stylesheet's first media matches");
  is(media[1].value, "print", "first stylesheet's second media is print");
  is(media[1].disabled, true, "first stylesheet's second media does not match");

  media = list.children[1].querySelectorAll(".stylesheet-media");
  is(media.length, 1, "second stylesheet has 1 media");
  is(media[0].value, "screen and (min-width: 200px)",
     "second stylesheet's media is screen and (min-width: 200px)");
  is(media[0].disabled, false, "second stylesheet's media matches");

  // resize the browser so that second stylesheet media does not match anymore
  gBrowserWindow.resizeTo(180, 300);

  executeSoon(function afterBrowserResize() {
    is(media[0].disabled, true,
       "second stylesheet's media does not match anymore after resize");

    finish();
  });
}

