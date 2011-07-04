#!/bin/env bash
# Helper script to migrate add-on code to the current browser branch.
#
# Migrates add-on code from <argument> commit (default: master).
# Adds to the index but does not commit.

if [ -z "$ADDON" ]; then
  ADDON=master
fi

STATUS=`git status --porcelain --untracked=no`
if [ -n "$STATUS" ]; then
  echo "Repository must be in a clean state."
#  exit 1
fi


git apply --index command.patch


GIT_REV=`git show-ref --head -d $ADDON | cut -d " " -f 1`
MESSAGE="Migrate add-on $GIT_REV to browser."

EXCLUDES="content/browser_overlay.xul"

CONTENT_URL_ADDON="chrome://StyleEditor/content/"
CONTENT_URL_ADDON_SED=$(echo $CONTENT_URL_ADDON | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')
CONTENT_URL_BROWSER="chrome://browser/content/StyleEditor/"
CONTENT_URL_BROWSER_SED=$(echo $CONTENT_URL_BROWSER | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')
BASE_URL_ADDON="chrome://StyleEditor/"
BASE_URL_ADDON_SED=$(echo $BASE_URL_ADDON | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')
BASE_URL_BROWSER="chrome://browser/"
BASE_URL_BROWSER_SED=$(echo $BASE_URL_BROWSER | sed -e 's/\\/\\\\/g' -e 's/\//\\\//g' -e 's/&/\\\&/g')

for FILE in `git ls-tree -r --name-only $ADDON content/`
do
  if [ $FILE == $EXCLUDES ]; then
    continue
  fi
  mkdir -p browser/base/content/StyleEditor
  BROWSER_FILE=browser/base/content/StyleEditor/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
  sed -i -e s/$CONTENT_URL_ADDON_SED/$CONTENT_URL_BROWSER_SED/g \
         -e s/$BASE_URL_ADDON_SED/$BASE_URL_BROWSER_SED/g \
      $BROWSER_FILE
done
git add browser/base/content/StyleEditor


for FILE in `git ls-tree -r --name-only $ADDON locale/en-US/`
do
  BROWSER_FILE=browser/locales/en-US/chrome/browser/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
done
git add browser/locales/en-US/chrome/browser


for FILE in `git ls-tree -r --name-only $ADDON skin/`
do
  BROWSER_FILE=browser/themes/gnomestripe/browser/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
  BROWSER_FILE=browser/themes/pinstripe/browser/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
  BROWSER_FILE=browser/themes/winstripe/browser/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
done
git add browser/themes


mkdir -p browser/base/content/test/StyleEditor
for FILE in `git ls-tree -r --name-only $ADDON test/ui/`
do
  BROWSER_FILE=browser/base/content/test/StyleEditor/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
done
git add browser/base/content/test/StyleEditor

echo "Done! Now fix up index if needed and run update.sh"

