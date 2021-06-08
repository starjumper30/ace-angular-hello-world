call node --version
call npm --version
call npm install
call npm run affected:lint -- --base=origin/main
call npm run format:check -- --base=origin/main
call npm run build
call npm run affected:test -- --base=origin/main
call npm run e2e
