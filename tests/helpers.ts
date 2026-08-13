import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

export interface StubRegistries {
  ctx: Context
  tools: string[]
  skills: string[]
  disposed: string[]
}

/** A minimal context exposing the three services this plugin injects. */
export function stubCtx(overrides: Record<string, unknown> = {}): StubRegistries {
  const tools: string[] = []
  const skills: string[] = []
  const disposed: string[] = []
  const ctx = {
    tools: {
      register(definition: ToolDefinition) {
        tools.push(definition.name)
        return () => { disposed.push(`tool:${definition.name}`) }
      },
    },
    skills: {
      register(skill: { name: string }) {
        skills.push(skill.name)
        return () => { disposed.push(`skill:${skill.name}`) }
      },
    },
    subprocess: {
      spawn: () => { throw new Error('unexpected subprocess.spawn during registration') },
    },
    ...overrides,
  }
  return { ctx: ctx as unknown as Context, tools, skills, disposed }
}
