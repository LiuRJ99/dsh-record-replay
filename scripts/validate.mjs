#!/usr/bin/env node
/** validate.mjs — build then test, failing loud on either. */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function run(args) {
  const result = spawnSync(pnpm, args, { cwd: REPO_ROOT, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(['build'])
run(['test'])
console.log('validate: ok')
