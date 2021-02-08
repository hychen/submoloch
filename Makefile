.PHONY: test
test:
	cargo +nightly test 

.PHONY: check
check:
	cargo +nightly contract check

.PHONY: build
build:
	cargo +nightly contract build

.PHONY: node
dev:
	canvas --dev --tmp

.PHONY: doc
doc:
	cargo +nightly doc --document-private-items

