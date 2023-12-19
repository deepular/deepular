#!/bin/sh
set -e

nx build compiler

DEEPULAR_COMPILER_PATH="$(pwd)/dist/packages/compiler/index.esm.js"

if ! grep -q "DEEPULAR_COMPILER_PATH=$DEEPULAR_COMPILER_PATH" "$(pwd)/.env"; then
  echo "DEEPULAR_COMPILER_PATH=$DEEPULAR_COMPILER_PATH" >> "$(pwd)/.env"
fi

node dist/packages/compiler/patch.esm.js "$DEEPULAR_COMPILER_PATH"
