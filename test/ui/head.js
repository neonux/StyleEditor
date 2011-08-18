/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

let gStyleEditor;  //StyleEditor object in browser window
let gChromeWindow; //StyleEditorChrome window


function cleanup()
{
  gChromeWindow.close();
  gChromeWindow = null;
  gBrowser.removeCurrentTab();
}

function addTabAndLaunchStyleEditorChromeWhenLoaded(aCallback)
{
  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad, true);

    gStyleEditor = StyleEditor;
    gChromeWindow = StyleEditor.openChrome();
    gChromeWindow.addEventListener("load", function onChromeLoad() {
      gChromeWindow.removeEventListener("load", onChromeLoad, false);
      aCallback(gChromeWindow.styleEditorChrome);
    }, false);
  }, true);
}
