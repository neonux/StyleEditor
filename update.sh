#!/bin/env bash
# Helper script to update manifests and other niceties.
# ADDITIONS ONLY

# update content JAR manifest with added files
for FILE in `git status --porcelain | grep "^A" | grep -o -E "browser/devtools/styleeditor/.*$"`
do
  FILE=`echo $FILE | cut -d " " -f 2`
  FILE=`basename $FILE`
  echo "        content/browser/StyleEditor/$FILE (content/StyleEditor/$FILE)" >> browser/base/jar.mn
done

# update locales JAR manifest with added files
for FILE in `git status --porcelain | grep "^A" | grep -o -E "browser/locales/en-US/chrome/browser/.*$"`
do
  FILE=`echo $FILE | cut -d " " -f 2`
  FILE=`basename $FILE`
  echo "    locale/browser/$FILE (%chrome/browser/$FILE)" >> browser/locales/jar.mn
done

# update themes JAR manifests with added files
THEMES="gnomestripe pinstripe winstripe"
for THEME in $THEMES
do
  for FILE in `git status --porcelain | grep "^A" | grep -o -E "browser/themes/$THEME/browser/.*$"`
  do
    FILE=`echo $FILE | cut -d " " -f 2`
    FILE=`basename $FILE`
    echo "  skin/classic/browser/$FILE" >> browser/themes/$THEME/browser/jar.mn
  done
done

echo "Done! Final fix up index if needed and commit!"

