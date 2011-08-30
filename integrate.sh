#!/bin/env bash
# Helper script to integrate add-on code to the current browser branch.
#
# Integrates add-on code from <argument> commit.
# Adds to the index but does not commit.

if [ -z "$1" ]; then
  echo "Usage: integrate.sh <extension-commit-or-branch>"
  exit 1
fi
ADDON="$1"

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
CONTENT_URL_BROWSER="chrome://browser/devtools/styleeditor/"
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
  mkdir -p browser/devtools/styleeditor
  BROWSER_FILE=browser/devtools/styleeditor/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
  sed -i -e s/$CONTENT_URL_ADDON_SED/$CONTENT_URL_BROWSER_SED/g \
         -e s/$BASE_URL_ADDON_SED/$BASE_URL_BROWSER_SED/g \
      $BROWSER_FILE
done
git add browser/devtools/styleeditor


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


insert_tests()
{
  while read -r; do
    if echo "$REPLY" | grep -q '@TESTS@'; then
      cat tests.tmp
      echo "                 \$(NULL)"
    else
      echo "$REPLY"
    fi
  done
}

mkdir -p browser/devtools/styleeditor/test
if [ -x tests.tmp ]; then
  rm tests.tmp
fi

for FILE in `git ls-tree -r --name-only $ADDON test/ui/`
do
  BROWSER_FILE=browser/devtools/styleeditor/test/`basename $FILE`
  git show $ADDON:$FILE > $BROWSER_FILE
  FILE=`basename $FILE`
  #if [[ $FILE == browser_*.js ]]; then
  echo "                 $FILE \\" >> tests.tmp
  #fi
done
insert_tests < test.Makefile.in.in > browser/devtools/styleeditor/test/Makefile.in
rm tests.tmp

git add browser/browser/devtools/styleeditor/test

echo "Done! Now fix up index if needed and run update.sh"
