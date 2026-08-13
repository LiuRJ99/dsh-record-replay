import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  generateSkillSkeleton,
  installSkill,
  resolveSkillTarget,
  summarizeEvidence,
  validateSkillDraft,
  validateSkillName,
  type SkillEvidenceSummary,
} from '../src/skillCreate.ts'

describe('validateSkillName', () => {
  it('accepts lowercase kebab-case names', () => {
    expect(validateSkillName('send-file-demo')).toBeNull()
    expect(validateSkillName('feishu-send-image')).toBeNull()
  })

  it('rejects empty, uppercase, underscore, and non-ascii names', () => {
    expect(validateSkillName('')).not.toBeNull()
    expect(validateSkillName('SendFile')).not.toBeNull()
    expect(validateSkillName('send_file')).not.toBeNull()
    expect(validateSkillName('发图片')).not.toBeNull()
  })
})

describe('validateSkillDraft', () => {
  const good = '---\nname: send-file-demo\ndescription: Send a file in a demo chat.\n---\n\n# Steps\n\n1. Do the thing.\n'

  it('accepts a well-formed draft', () => {
    expect(validateSkillDraft('send-file-demo', good)).toEqual([])
  })

  it('rejects a draft without frontmatter', () => {
    expect(validateSkillDraft('send-file-demo', '# No frontmatter\n').join('\n')).toContain('frontmatter')
  })

  it('rejects a mismatched or invalid name', () => {
    const mismatched = good.replace('send-file-demo', 'other-name')
    expect(validateSkillDraft('send-file-demo', mismatched).join('\n')).toContain('does not match')
    const invalid = good.replace('send-file-demo', 'Bad Name')
    expect(validateSkillDraft('send-file-demo', invalid).join('\n')).toContain('kebab-case')
  })

  it('requires a non-empty description', () => {
    const noDesc = good.replace(/^description:.*$/m, '')
    expect(validateSkillDraft('send-file-demo', noDesc).join('\n')).toContain('description')
  })
})

describe('summarizeEvidence', () => {
  it('extracts apps, urls, action counts, and semantic actions, skipping AX trees', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'orr-skill-'))
    try {
      const eventsPath = path.join(dir, 'events.jsonl')
      writeFileSync(eventsPath, [
        JSON.stringify({ kind: 'session.started', timestamp: '2026-08-13T10:00:00Z' }),
        JSON.stringify({ kind: 'window.changed', timestamp: '2026-08-13T10:00:01Z', app: { name: '飞书' }, window: { title: '会话', url: 'file:///lark' } }),
        JSON.stringify({ kind: 'mouse.click', timestamp: '2026-08-13T10:00:02Z', app: { name: '飞书' }, mouse: { target: { role: 'AXButton', description: '发送' } } }),
        JSON.stringify({ kind: 'mouse.click', timestamp: '2026-08-13T10:00:03Z', app: { name: '飞书' }, mouse: {} }),
        JSON.stringify({ kind: 'keyboard.text_input', timestamp: '2026-08-13T10:00:04Z', app: { name: '飞书' }, text: 'hello' }),
        JSON.stringify({ kind: 'session.ended', timestamp: '2026-08-13T10:00:05Z' }),
      ].join('\n') + '\n', 'utf8')

      const summary = summarizeEvidence(eventsPath)
      expect(summary.apps).toContain('飞书')
      expect(summary.urls).toContain('file:///lark')
      expect(summary.actionCounts['mouse.click']).toBe(2)
      expect(summary.actions.some(a => a.kind === 'mouse.click' && a.semantic === '发送')).toBe(true)
      expect(summary.durationMs).toBe(5000)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('generateSkillSkeleton', () => {
  const summary: SkillEvidenceSummary = {
    sessionId: 'S1',
    apps: ['飞书'],
    windowTitles: [],
    urls: ['file:///lark'],
    actionCounts: { 'mouse.click': 2 },
    actions: [
      { kind: 'mouse.click', app: '飞书', semantic: '发送' },
      { kind: 'keyboard.text_input', app: '飞书', semantic: 'hello' },
    ],
  }

  it('produces a frontmatter-shaped document with steps', () => {
    const doc = generateSkillSkeleton(summary, 'send-file-demo', 'Send a file in a demo chat.')
    expect(doc).toMatch(/^---\nname: send-file-demo\n/)
    expect(doc).toContain('description: Send a file in a demo chat.')
    expect(doc).toContain('## 触发时机')
    expect(doc).toContain('1. 点击在 飞书 中（发送）')
    expect(doc).toContain('## 校验')
    expect(validateSkillDraft('send-file-demo', doc).filter(p => !p.startsWith('frontmatter name')).length).toBeLessThan(3)
  })
})

describe('installSkill / resolveSkillTarget', () => {
  it('installs a skill and refuses to overwrite without consent', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'orr-skill-install-'))
    try {
      const target = path.join(dir, 'skills')
      const first = installSkill({ target, name: 'demo-skill', content: '---\nname: demo-skill\ndescription: x\n---\nbody\n', overwrite: false })
      expect(path.basename(first.skillPath)).toBe('SKILL.md')
      expect(readFileSync(first.skillPath, 'utf8')).toContain('demo-skill')
      expect(readFileSync(first.evalsPath!, 'utf8')).toContain('"skill_name": "demo-skill"')
      expect(() => installSkill({ target, name: 'demo-skill', content: 'x', overwrite: false })).toThrow(/already exists/)
      const replaced = installSkill({ target, name: 'demo-skill', content: 'y', overwrite: true })
      expect(readFileSync(replaced.skillPath, 'utf8')).toBe('y')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('resolves relative targets against cwd and defaults to the agents skills dir', () => {
    expect(resolveSkillTarget('skills-local', '/ws')).toBe(path.join('/ws', 'skills-local'))
    expect(resolveSkillTarget('/abs/skills', '/ws')).toBe('/abs/skills')
    expect(resolveSkillTarget(undefined, '/ws')).toBe(path.join(os.homedir(), '.agents', 'skills'))
  })
})
