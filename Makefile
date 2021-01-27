.PHONY: test
test:
	cargo +nightly test --release --all

.PHONY: build
build:
	cargo +nightly contract build

.PHONY: node
dev:
	canvas --dev --tmp

.PHONY: doc
run:
	rm -r target/docs
	cargo +nighlty doc --no-deps

