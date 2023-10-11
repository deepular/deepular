#!/bin/sh
set -e
nx build compiler
node dist/packages/compiler/install.esm.js "$(pwd)/dist/packages/compiler/index.esm.js"
