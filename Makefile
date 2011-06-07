VERSION=`git describe --tags --dirty | tail -c +2`
XPI="build/StyleEditor-${VERSION}.xpi"

export TEST_PATH=browser/base/content/test/StyleEditor

.PHONY: xpi test

xpi:
	@echo "Building '${XPI}'..."
	@mkdir -p build
	@git archive --format=zip -o ${XPI} HEAD

test:
	@ln -sfT `pwd`/test/ui ${OBJDIR}/_tests/testing/mochitest/browser/${TEST_PATH}
	@make -C ${OBJDIR} mochitest-browser-chrome

