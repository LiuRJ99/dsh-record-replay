#!/usr/bin/env node
/**
 * link-dsh.mjs — link the DeepSeek Harness `@deepseek-ai` package scope into
 * this repo's node_modules so tsc and vitest resolve the DSH packages during
 * local development (the packages are peers at runtime and resolve through the
 * harness, so they are not fetched by `pnpm install`).
 *
 * Source resolution order:
 *   1. --path <dir>            an explicit `node_modules/@deepseek-ai` scope dir
 *   2. $DSH_HOME/profiles/node_modules/@deepseek-ai   (maintained by the harness)
 *
 * Idempotent: re-running replaces the link.
 */

import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function arg(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

let scope = arg('--path')
if (scope === undefined || scope === '') {
  const dshHome = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
  scope = path.join(dshHome, 'profiles', 'node_modules', '@deepseek-ai')
}

if (!existsSync(scope)) {
  console.error(`[link-dsh] scope directory not found: ${scope}`)
  console.error('  Pass --path <dsh-checkout-or-profiles>/node_modules/@deepseek-ai')
  process.exit(1)
}

const target = path.join(REPO_ROOT, 'node_modules', '@deepseek-ai')
mkdirSync(path.dirname(target), { recursive: true })
rmSync(target, { recursive: true, force: true })
symlinkSync(scope, target, 'dir')
console.log(`[link-dsh] linked node_modules/@deepseek-ai -> ${scope}`)
