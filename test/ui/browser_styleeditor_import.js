/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

// http rather than chrome to improve coverage
const TEST_BASE = "http://example.com/browser/browser/base/content/test/StyleEditor/";
const TESTCASE_URI = TEST_BASE + "simple.html";

Components.utils.import("resource://gre/modules/FileUtils.jsm");
const FILENAME = "styleeditor-import-test.css";
const SOURCE = "body{background:red;}";


function test()
{
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    aChrome.addChromeListener({
      onContentAttach: run,
      onEditorAdded: testImported
    });
    if (aChrome.isContentAttached) {
      run(aChrome);
    }
  });

  content.location = TESTCASE_URI;
}

function run(aChrome)
{
  is(aChrome.editors.length, 2,
     "there is 2 stylesheets initially");

  // create file to import first
  let file = FileUtils.getFile("ProfD", [FILENAME]);
  let ostream = FileUtils.openSafeFileOutputStream(file);
  let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8";
  let istream = converter.convertToInputStream(SOURCE);
  NetUtil.asyncCopy(istream, ostream, function (status) {
    FileUtils.closeSafeFileOutputStream(ostream);

    // click the import button now that the file to import is ready
    waitForFocus(function () {
      aChrome._mockImportFile = file;

      let document = gChromeWindow.document
      let importButton = document.querySelector(".style-editor-importButton");
      EventUtils.synthesizeMouseAtCenter(importButton, {}, gChromeWindow);
    }, gChromeWindow);
  });
}

function testImported(aChrome, aEditor)
{
  if (!aEditor.hasFlag("imported")) {
    return;
  }

  ok(!aEditor.hasFlag("inline"),
     "imported stylesheet does not have INLINE flag");

  ok(aEditor.savedFile,
     "imported stylesheet will be saved directly into the same file");

  is(aEditor.getFriendlyName(), FILENAME,
     "imported stylesheet has the same name as the filename");

  finish();
}
