import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { apply, Config, inject, name } from '../src/index.ts'
import { stubCtx } from './helpers.ts'

const FIXTURE_CLI = fileURLToPath(new URL('./fixtures/fake-orr.mjs', import.meta.url))

describe('dsh-record-replay registration contracts', () => {
  it('exports a namespace plugin with the expected service injections', () => {
    expect(name).toBe('record-replay')
    expect(inject).toEqual(['tools', 'skills', 'subprocess'])
    expect(Config).toBeDefined()
  })

  it('registers the skill and all six tools through the real registries', () => {
    const { ctx, tools, skills } = stubCtx()
    apply(ctx, { cliPath: FIXTURE_CLI })
    expect(skills).toEqual(['open-record-replay'])
    expect(tools).toEqual([
      'orr_permissions_check',
      'orr_record_start',
      'orr_record_stop',
      'orr_session_events',
      'orr_session_validate',
      'orr_skill_prepare',
      'orr_skill_create',
    ])
  })

  it('fails loud when no CLI is resolvable', () => {
    const { ctx } = stubCtx()
    const previous = process.env.ORR_CLI_PATH
    const previousRoot = process.env.ORR_REPO_ROOT
    delete process.env.ORR_CLI_PATH
    delete process.env.ORR_REPO_ROOT
    try {
      expect(() => apply(ctx, {})).toThrow(/needs an open-record-replay CLI/)
    } finally {
      if (previous === undefined) delete process.env.ORR_CLI_PATH
      else process.env.ORR_CLI_PATH = previous
      if (previousRoot === undefined) delete process.env.ORR_REPO_ROOT
      else process.env.ORR_REPO_ROOT = previousRoot
    }
  })

  it('fails loud when the configured CLI file does not exist', () => {
    const { ctx } = stubCtx()
    expect(() => apply(ctx, { cliPath: '/definitely/not/here/orr.js' })).toThrow(/CLI not found/)
  })

  it('rolls back cleanly: a skill-registration failure registers no tools', () => {
    const { ctx, tools } = stubCtx({
      skills: { register: () => { throw new Error('skill failed') } },
    })
    expect(() => apply(ctx, { cliPath: FIXTURE_CLI })).toThrow('skill failed')
    expect(tools).toEqual([])
  })

  it('rolls back cleanly: a tool-registration failure throws through apply', () => {
    const registered: string[] = []
    const ctx = {
      skills: { register: () => () => {} },
      subprocess: { spawn: () => { throw new Error('unexpected spawn') } },
      tools: {
        register(definition: { name: string }) {
          registered.push(definition.name)
          if (registered.length === 3) throw new Error('tool failed')
          return () => {}
        },
      },
    }
    expect(() => apply(ctx as never, { cliPath: FIXTURE_CLI })).toThrow('tool failed')
    expect(registered.slice(0, 2)).toEqual(['orr_permissions_check', 'orr_record_start'])
  })
})
