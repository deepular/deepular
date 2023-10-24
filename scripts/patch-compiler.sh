#!/bin/sh
set -e

nx build compiler

NGKIT_COMPILER_PATH="$(pwd)/dist/packages/compiler/index.esm.js"

if ! grep -q "NGKIT_COMPILER_PATH=$NGKIT_COMPILER_PATH" "$(pwd)/.env"; then
  echo "NGKIT_COMPILER_PATH=$NGKIT_COMPILER_PATH" >> "$(pwd)/.env"
fi

node dist/packages/compiler/patch.esm.js "$NGKIT_COMPILER_PATH"
