#!/usr/bin/env node
// Fake Open Record/Replay CLI used by tests: it only needs to exist so the
// plugin's CLI-path validation passes during registration; tool execution is
// covered separately with a stubbed subprocess service.
process.stdout.write(JSON.stringify({ fake: true }) + '\n')
