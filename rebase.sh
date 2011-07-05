#!/bin/env bash
# Helper script to rebase upstream into browser-<UPSTREAM_HG_REV> branch.

if [ -z "$MOZILLA_SOURCE" ]; then
  echo "MOZILLA_SOURCE environment variable must be set"
  exit 1
fi

STATUS=`git status --porcelain --untracked=no`
if [ -n "$STATUS" ]; then
  echo "Repository must be in a clean state."
  exit 1
fi

export GIT_DIR=$MOZILLA_SOURCE/.git
export GIT_WORK_TREE=$MOZILLA_SOURCE
GIT_REV=`git show-ref --abbrev --head -d HEAD | cut -d " " -f 1`
HG_REV=`git show-hg-rev $GIT_REV | head -c 7`

MESSAGE="Rebase browser hg=$HG_REV git=$GIT_REV."
unset GIT_DIR
unset GIT_WORK_TREE

FILES="\
browser/base/content/browser-appmenu.inc \
browser/base/content/browser-sets.inc \
browser/base/content/browser-menubar.inc \
browser/base/content/test/Makefile.in \
browser/base/content/browser.js \
browser/base/content/browser.xul \
browser/base/jar.mn \
browser/locales/en-US/chrome/browser/browser.dtd \
browser/locales/jar.mn \
browser/themes/pinstripe/browser/jar.mn \
browser/themes/gnomestripe/browser/jar.mn \
browser/themes/winstripe/browser/jar.mn \
"

for FILE in $FILES
do
  mkdir -p `dirname $FILE`
  cp $MOZILLA_SOURCE/$FILE $FILE
done

git checkout -b browser-$HG_REV
if [ $? -ne 0 ]; then
	echo "*ABORTED* Could not check out new branch. Already exists?"
	exit 1
fi

git add browser
git commit -m "$MESSAGE"

echo "Done! Now fix up index if needed and run integrate.sh <addon-branch>"

