import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { SubprocessHandle } from '@deepseek-ai/dsh-subprocess'
import { resolveConfig, RecordReplayConfigError } from '../src/config.ts'
import { resolveCliPath, runOrr, runOrrJson } from '../src/runner.ts'

function fakeHandle(stdout: string, exitCode: number | null): SubprocessHandle {
  return {
    done: Promise.resolve({ exitCode, signal: null }),
    collected: {
      stdout: { readFrom: () => ({ text: stdout, nextOffset: stdout.length, lossy: false }) },
      stderr: { readFrom: () => ({ text: '', nextOffset: 0, lossy: false }) },
    },
    stdin: undefined,
    stdout: undefined,
    stderr: undefined,
    terminate: () => {},
    waitForExit: async () => true,
  } as SubprocessHandle
}

function stubSubprocess(stdout: string, exitCode: number | null) {
  const spawns: Array<{ argv: readonly string[]; cwd: string }> = []
  return {
    spawns,
    ctx: { subprocess: { spawn: (spec: { argv: readonly string[]; cwd: string }) => { spawns.push({ argv: spec.argv, cwd: spec.cwd }); return fakeHandle(stdout, exitCode) } } } as unknown as Context,
  }
}

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(resolveConfig({})).toEqual({ runsOut: 'runs', skillInputsOut: 'skill-inputs' })
  })

  it('rejects absolute and traversal paths', () => {
    expect(() => resolveConfig({ runsOut: '/abs' })).toThrow(RecordReplayConfigError)
    expect(() => resolveConfig({ skillInputsOut: '../out' })).toThrow(RecordReplayConfigError)
  })
})

describe('resolveCliPath', () => {
  it('prefers cliPath over repoRoot over environment', () => {
    const previous = process.env.ORR_CLI_PATH
    const previousRoot = process.env.ORR_REPO_ROOT
    process.env.ORR_CLI_PATH = '/env/orr.js'
    process.env.ORR_REPO_ROOT = '/env/repo'
    try {
      expect(resolveCliPath({ cliPath: '/cli/orr.js', repoRoot: '/repo' })).toBe('/cli/orr.js')
      expect(resolveCliPath({ repoRoot: '/repo' })).toBe('/repo/bin/orr.js')
      expect(resolveCliPath({})).toBe('/env/orr.js')
    } finally {
      if (previous === undefined) delete process.env.ORR_CLI_PATH
      else process.env.ORR_CLI_PATH = previous
      if (previousRoot === undefined) delete process.env.ORR_REPO_ROOT
      else process.env.ORR_REPO_ROOT = previousRoot
    }
  })

  it('throws when nothing is resolvable', () => {
    const previous = process.env.ORR_CLI_PATH
    const previousRoot = process.env.ORR_REPO_ROOT
    delete process.env.ORR_CLI_PATH
    delete process.env.ORR_REPO_ROOT
    try {
      expect(() => resolveCliPath({})).toThrow(RecordReplayConfigError)
    } finally {
      if (previous === undefined) delete process.env.ORR_CLI_PATH
      else process.env.ORR_CLI_PATH = previous
      if (previousRoot === undefined) delete process.env.ORR_REPO_ROOT
      else process.env.ORR_REPO_ROOT = previousRoot
    }
  })
})

describe('runOrr', () => {
  it('spawns node with the resolved CLI and bounded output, then parses JSON', async () => {
    const stdout = JSON.stringify({ permissions: { recorderReady: true } })
    const { ctx, spawns } = stubSubprocess(stdout, 0)
    const value = await runOrrJson(ctx, '/path/to/orr.js', '/ws', ['permissions', 'check'], undefined, 60_000)
    expect(spawns).toHaveLength(1)
    expect(spawns[0]!.argv[0]).toBe(process.execPath)
    expect(spawns[0]!.argv[1]).toBe('/path/to/orr.js')
    expect(spawns[0]!.argv.slice(2)).toEqual(['permissions', 'check'])
    expect(spawns[0]!.cwd).toBe('/ws')
    expect(value).toEqual({ permissions: { recorderReady: true } })
  })

  it('falls back to raw stdout when the CLI emits non-JSON', async () => {
    const { ctx } = stubSubprocess('not json', 0)
    const value = await runOrrJson(ctx, '/path/to/orr.js', '/ws', ['x'], undefined, 60_000)
    expect(value).toEqual({ raw_stdout: 'not json' })
  })

  it('returns the exit code for a non-zero result', async () => {
    const { ctx } = stubSubprocess('', 1)
    const result = await runOrr(ctx, '/path/to/orr.js', '/ws', ['x'], undefined, 60_000)
    expect(result.exitCode).toBe(1)
  })
})
