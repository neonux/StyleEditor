This branch has helpers for integration of Style Editor add-on into the browser.

The feature is disabled by default in the browser.
To enable pref 'devtools.style_editor.enabled' must be set to 'true'.

Typical integration procedure :

$ MOZILLA_SOURCE=... ./rebase.sh
$ ./integrate.sh master
$ ./update.sh
$ git commit -a --amend
