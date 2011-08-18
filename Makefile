VERSION=`git describe --tags --dirty | tail -c +2`
XPI="build/StyleEditor-${VERSION}.xpi"

export TEST_PATH=browser/base/content/test/StyleEditor

export COVERAGE_PROJECT=Style Editor
export COVERAGE_FILTER=*/StyleEditor.jsm */StyleEditorChrome.jsm */StyleEditorUtil.jsm */StyleEditorTextboxDriver.jsm */AdaptiveSplitView.jsm
COVERAGE_DIR="build/coverage/${VERSION}"

.PHONY: xpi test testcoverage

xpi:
	@echo "Building '${XPI}'..."
	@mkdir -p build
	@git archive --format=zip -o ${XPI} HEAD

test:
	@ln -sfT `pwd`/test/ui ${OBJDIR}/_tests/testing/mochitest/browser/${TEST_PATH}
	@make -C ${OBJDIR} mochitest-browser-chrome

testcoverage:
	@ln -sfT `pwd`/test/ui ${OBJDIR}/_tests/testing/mochitest/browser/${TEST_PATH}
	-@COVERAGE=1 make -C ${OBJDIR} mochitest-browser-chrome
	@mkdir -p ${COVERAGE_DIR}
	@python ${MOZILLA_SRC}/tools/coverage/aggregate.py ~/coverage.json > ${COVERAGE_DIR}/coverage.json
	@cd ${COVERAGE_DIR}; COVERAGE_VERSION=${VERSION} python ${MOZILLA_SRC}/tools/coverage/report.py coverage.json
