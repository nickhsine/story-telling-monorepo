P := "\\033[32m[+]\\033[0m"

help:
	@echo "$(P) make dev - Start webpack dev server and watch any changes"
	@echo "$(P) make build - Transpile source codes to esm and commonjs syntax"

dev: 
	@echo "$(P) Start webpack dev server"
	NODE_ENV=development yarn webpack serve -c dev/webpack.config.js

build-lib:
	@echo "$(P) Transpile source codes to esm and commonjs syntax"
	mkdir -p lib
	BUILD_TARGET=esmodule NODE_ENV=production yarn babel src --out-dir lib/esm --extensions '.ts,.tsx,.js,.jsx' --copy-files --root-mode upward
	echo '{ "type": "module" }' > lib/esm/package.json
	BUILD_TARGET=commonjs NODE_ENV=production yarn babel src --out-dir lib/cjs --extensions '.ts,.tsx,.js,.jsx' --copy-files --root-mode upward
	echo '{ "type": "commonjs" }' > lib/cjs/package.json

build: clean build-lib

clean:
	@echo "$(P) Clean lib/"
	rm -rf lib/

.PHONY: build clean dev build-lib
