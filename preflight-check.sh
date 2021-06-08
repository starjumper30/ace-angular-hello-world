#!/bin/bash
set -e

node --version
npm --version
npm install
npm run affected:lint -- --base=origin/main
npm run format:check -- --base=origin/main
npm run build
npm run affected:test -- --base=origin/main
npm run e2e
