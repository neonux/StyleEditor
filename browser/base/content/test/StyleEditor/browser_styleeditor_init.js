/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_BASE = "chrome://mochitests/content/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

let gStyleEditor;  //StyleEditor object in browser window
let gChromeWindow; //StyleEditorChrome window


function test()
{
  registerCleanupFunction(cleanup);
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad() {
    gBrowser.selectedBrowser.removeEventListener("load", onLoad, false);

    ok(StyleEditor, "StyleEditor object exists in browser window");
    gStyleEditor = StyleEditor; // keep to test singleton behavior later

    gChromeWindow = StyleEditor.openChrome();
    gChromeWindow.addEventListener("load", run, false);
  }, true);

  content.location = TESTCASE_URI;
}

function run()
{
  gChromeWindow.removeEventListener("load", run, false);

  let SEC = gChromeWindow.styleEditorChrome;
  ok(SEC, "StyleEditorChrome object exists in new window");

  // check forEachStyleSheet API
  let apiCount = 0;
  let list = SEC.forEachStyleSheet(function styleSheet(editor, listItem) {
    ok(editor.load, "first arg is instance of StyleEditor");
    ok(listItem.tagName == "richlistitem", "second arg is a list item");
    apiCount++;
  });
  is(apiCount, 2, "iterated 2 stylesheets");

  // check editors API
  is(SEC.editors.length, 2, "got 2 editors");

  // check we got document's style sheets in the list
  let listBox = gChromeWindow.document.querySelector("richlistbox");
  let listItems = listBox.querySelectorAll("richlistitem");
  is(listItems.length, 2, "2 stylesheets are listed in Stylesheets panel");

  // check flags
  let isInline = listItems[0].className.indexOf("inline") >= 0;
  ok(!isInline, "first stylesheet does not have 'inline' flag");

  isInline = listItems[1].className.indexOf("inline") >= 0;
  ok(isInline, "second stylesheet has 'inline' flag");

  // check rule counts
  let ruleCount = listItems[0].querySelector(".stylesheet-rule-count").value;
  is(parseInt(ruleCount), 1, "first stylesheet list item counts 1 rule");

  ruleCount = listItems[1].querySelector(".stylesheet-rule-count").value;
  is(parseInt(ruleCount), 3, "second stylesheet list item counts 3 rules");

  let chromeWindow = gStyleEditor.openChrome();
  is(chromeWindow, gChromeWindow,
     "attempt to edit the same document returns the same Style Editor window");

  finish();
}
