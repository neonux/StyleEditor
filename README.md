This branch has helpers for integration of Style Editor add-on into the browser.

The feature is disabled by default in the browser.
To enable pref 'devtools.style_editor.enabled' must be set to 'true'.

Typical integration procedure :

$ git checkout <the_rev_or_branch_you_want_to_integrate_in_browser> -- content skin locale test
$ git reset
$ ./rebase.sh
$ ./integrate.sh
$ ./update.sh

(fix up if needed between steps, it usually isn't)
