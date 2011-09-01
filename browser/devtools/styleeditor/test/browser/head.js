/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

let gStyleEditor = StyleEditor;  //StyleEditor object in browser window
let gChromeWindow;               //StyleEditorChrome window


function cleanup()
{
  gStyleEditor = null;
  gChromeWindow.close();
  gChromeWindow = null;
  gBrowser.removeCurrentTab();
}

function launchStyleEditorChrome(aCallback)
{
  gChromeWindow = gStyleEditor.openChrome();
  if (gChromeWindow.document.readyState != "complete") {
    gChromeWindow.addEventListener("load", function onChromeLoad() {
      gChromeWindow.removeEventListener("load", onChromeLoad, true);
      aCallback(gChromeWindow.styleEditorChrome);
    }, true);
  } else {
    aCallback(gChromeWindow.styleEditorChrome);
  }
}

function addTabAndLaunchStyleEditorChromeWhenLoaded(aCallback)
{
  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad, true);
    launchStyleEditorChrome(aCallback);
  }, true);
}
