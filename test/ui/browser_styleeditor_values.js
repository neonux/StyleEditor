/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TESTCASE_URI = TEST_BASE + "values.html";


function test()
{
  waitForExplicitFinish();

  addTabAndLaunchStyleEditorChromeWhenLoaded(function (aChrome) {
    function createNewStyleSheet() {
      executeSoon(function () {
        waitForFocus(function () {
          let newButton = gChromeWindow.document.querySelector(".style-editor-newButton");
          EventUtils.synthesizeMouseAtCenter(newButton, {}, gChromeWindow);
        }, gChromeWindow);
      });
    }

    aChrome.addChromeListener({
      onContentAttach: createNewStyleSheet,
      onEditorAdded: function (aChrome, aEditor) {
        if (aEditor.sourceEditor) {
          run(aEditor); // already attached to input element
        } else {
          aEditor.addActionListener({
            onAttach: run
          });
        }
      }
    });
    if (aChrome.isContentAttached) {
      createNewStyleSheet();
    }
  });

  content.location = TESTCASE_URI;
}

// on one line to avoid offset gym
const SOURCE = "body { padding: 100px; background: white; border: 2em solid #ff8080;} p { color: rgba(0,100,200,0.5); background: hsl(0,0%,50%); }";
const ADJUST_MODS = {altKey: true};
const ALTERNATE_ADJUST_MODS = {altKey: true, shiftKey: true};

function run(aEditor)
{
  aEditor.sourceEditor.setText(SOURCE);

  testLengthAdjustments(aEditor.sourceEditor);
  testColorAdjustments(aEditor.sourceEditor);
  testNumberAdjustments(aEditor.sourceEditor);
  testEnumAdjustements(aEditor.sourceEditor);

  finish();
}

function isExpectedTextAtOffset(aSourceEditor, aExpected, aOffset)
{
  is(aSourceEditor.getText(aOffset, aOffset + aExpected.length), aExpected,
     "got expected text " + aExpected + " at offset " + aOffset);
}

function testLengthAdjustments(aSourceEditor)
{
  let offset = 16; // just before '100px'
  let caret = offset;
  aSourceEditor.setCaretOffset(caret);

  //
  // test increment/decrement
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "101px", offset);
  is(aSourceEditor.getCaretOffset(), offset, "caret did not move");

  caret = 16 + "101px".length; // just after '101px'
  aSourceEditor.setCaretOffset(caret);

  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "99px", offset);
  is(aSourceEditor.getCaretOffset(), --caret,
     "caret did adjust to end of shortened token");
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "100px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");

  //
  // test double/halve
  EventUtils.synthesizeKey("VK_PAGE_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "200px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");
  EventUtils.synthesizeKey("VK_PAGE_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "100px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");

  //
  // test cycling units
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  // 96px

  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "72pt", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "6pc", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2.54cm", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "254mm", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "1in", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "96px", offset);

  // adjust again left, to check it cycles backwards
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "254mm", offset);
}

function testLengthAdjustments(aSourceEditor)
{
  let offset = 16; // just before '100px'
  let caret = offset;
  aSourceEditor.setCaretOffset(caret);

  //
  // test increment/decrement
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "101px", offset);
  is(aSourceEditor.getCaretOffset(), offset, "caret did not move");

  caret = 16 + "101px".length; // just after '101px'
  aSourceEditor.setCaretOffset(caret);

  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "99px", offset);
  is(aSourceEditor.getCaretOffset(), --caret,
     "caret did adjust to end of shortened token");
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "100px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");

  //
  // test double/halve
  EventUtils.synthesizeKey("VK_PAGE_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "200px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");
  EventUtils.synthesizeKey("VK_PAGE_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "100px", offset);
  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");

  //
  // test cycling units
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  // 96px

  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "72pt", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "6pc", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2.54cm", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "254mm", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "1in", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "96px", offset);

  // adjust again left, to check it cycles backwards
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "254mm", offset);
}

function testColorAdjustments(aSourceEditor)
{
  let offset = 35; // just before 'white'
  let caret = offset;
  aSourceEditor.setCaretOffset(caret);

  //
  // test increment/decrement
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgb(255,255,255)", offset);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgb(252,252,252)", offset);

  //
  // test double/halve
  EventUtils.synthesizeKey("VK_PAGE_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgb(255,255,255)", offset);
  EventUtils.synthesizeKey("VK_PAGE_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgb(128,128,128)", offset);

  //
  // test cycling units
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgba(128,128,128,1)", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "#808080", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "#888", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,0%,50%)", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsla(0,0%,50%,1)", offset);
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,0%,50%)", offset);

  // test adjust saturation
  EventUtils.synthesizeKey("VK_UP", ALTERNATE_ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,1%,50%)", offset);
  EventUtils.synthesizeKey("VK_DOWN", ALTERNATE_ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,0%,50%)", offset);

  // test adjust hue
  EventUtils.synthesizeKey("VK_LEFT", ALTERNATE_ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(359,0%,50%)", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ALTERNATE_ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,0%,50%)", offset);

  // reset to 'white'
  aSourceEditor.setText("white", offset, offset +  "hsl(0,0%,50%)".length);

  offset = 60; // just before '#ff8080'
  caret = offset;
  aSourceEditor.setCaretOffset(caret);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "#ff7a7a", offset);

  offset = 81; // just before 'rgba(0,100,200,0.5)'
  caret = offset;
  aSourceEditor.setCaretOffset(caret);
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "rgba(0,102,204,0.5)", offset);

  offset = 114; // just before 'hsl(0,0,50)'
  caret = offset;
  aSourceEditor.setCaretOffset(caret);
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "hsl(0,0%,51%)", offset);
}

function testNumberAdjustments(aSourceEditor)
{
  let offset = 50;        // just before '2em'
  let caret = offset + 1; // between '2' and 'em'
  aSourceEditor.setCaretOffset(caret); 

  //
  // test increment/decrement
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "3em", offset);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2em", offset);

  //
  // test double/halve
  EventUtils.synthesizeKey("VK_PAGE_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "4em", offset);
  EventUtils.synthesizeKey("VK_PAGE_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2em", offset);

  //
  // test cycling units => no change (a plain number does not have an unit)
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2em", offset);
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "2em", offset);
}

function testEnumAdjustements(aSourceEditor)
{
  let offset = 54;        // just before 'solid'
  let caret = offset + 2; // caret within 'solid'
  aSourceEditor.setCaretOffset(caret);

  //
  // test increment/decrement => not applicable for enums (no change)
  EventUtils.synthesizeKey("VK_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "solid", offset);
  EventUtils.synthesizeKey("VK_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "solid", offset);

  //
  // test double/halve => not applicable for enums (no change)
  EventUtils.synthesizeKey("VK_PAGE_UP", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "solid", offset);
  EventUtils.synthesizeKey("VK_PAGE_DOWN", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "solid", offset);

  //
  // test cycling enum
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "dashed", offset);
  EventUtils.synthesizeKey("VK_RIGHT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "dotted", offset);
  EventUtils.synthesizeKey("VK_LEFT", ADJUST_MODS, gChromeWindow);
  isExpectedTextAtOffset(aSourceEditor, "dashed", offset);

  is(aSourceEditor.getCaretOffset(), caret, "caret did not move");
}
