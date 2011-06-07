# Style Editor #


## Description ##

StyleEditor is designed for tweaking CSS stylesheets on existing web pages and
styling a web page from scratch, right from within the browser.

It has many features to make styling a web page faster, efficient, and fun :

* text-based editor, freely edit and organize your style sheets as you like
* real-time application of changes

Much more to come...


## Build Instructions ##

From inside the project directory, run:

make

or:

zip -r ../StyleEditor.xpi * -x ".git/*"


## Installation ##

Note that the Style Editor requires Firefox 5 or later.
Drag and drop StyleEditor.xpi in Firefox, follow instructions to install add-on.


## Testsuite ##

To run the tests, you need to build Mozilla from source.
Set environment variable OBJDIR to point to your tree's OBJDIR, then run :

make test


## Embedding ##

Example to embed Style Editor in a textbox to edit a new stylesheet :

Components.utils.import("chrome://StyleEditor/content/StyleEditor.jsm");
let editor = new StyleEditor(aContentDocumentYouWantToEdit);
editor.inputElement = document.getElementById("id_of_a_xul_textbox");
editor.load();

If you want to edit an existing stylesheet, StyleEditor constructor accepts
a second optional argument with the DOMStyleSheet object to edit.


## Legal ##

Licensed under the tri-license MPL 1.1/GPL 2.0/LGPL 2.1.
See LICENSE.txt for details.

The logo icon.png and derivatives are attributed to the W3C and licensed under
CC Attribution 3.0 Unported <http://creativecommons.org/licenses/by/3.0/>.


## More ##

For documentation, feedback, contributions :
http://wiki.mozilla.org/DevTools/Features/StyleEditor

