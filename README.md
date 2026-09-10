# dsh-record-replay

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that
turns the [Open Record/Replay](https://github.com/humblebanana/open-record-replay)
macOS workflow recorder into first-class harness capabilities.

It registers the **`open-record-replay` skill** and **six model-facing `orr_*`
tools**, so an agent can learn a user-demonstrated desktop workflow: record the
user's real macOS actions, validate the evidence, and package it for the host
agent's native skill creator.

```text
user demonstrates a workflow
  -> orr_record_start            (capture session.json + events.jsonl)
  -> orr_record_stop             (finalize)
  -> orr_session_validate        (check the evidence against the contract)
  -> orr_session_events          (read what the user actually did)
  -> orr_skill_prepare           (package a skill-input directory)
  -> host skill creator
```

## Requirements

- macOS (the recorder's native backend is Swift; it needs Xcode Command Line Tools).
- Node.js `>= 22.19` (the Harness runtime).
- A DeepSeek Harness installation.
- An [open-record-replay](https://github.com/humblebanana/open-record-replay)
  checkout whose `bin/orr.js` the plugin invokes.

## Install

This fork commits its build output, so a `github:` install needs no build step:

```bash
dsh plugin --profile web add github:LiuRJ99/dsh-record-replay#v0.3.0
```

`dsh plugin add` records the package in the profile's `package.json`
dependencies and `dsh.profile.bundles`. The shipped `cordis.patch.yml` mounts a
neutral row; point it at your checkout by overlaying the row from your profile's
`cordis.patch.yml`:

```yaml
- id: record-replay
  config:
    repoRoot: '/absolute/path/to/open-record-replay'
    runsOut: 'runs'
    skillInputsOut: 'skill-inputs'
```

**Restart the Harness after installing.** The profile patch layer is
hot-reloaded, but that reload re-reads the patch *file* only — it reuses the
bundle list snapshot taken at boot. A profile that already booted without this
bundle will not mount it until `dsh web` is restarted.

To build from source instead:

```bash
pnpm install
node scripts/link-dsh.mjs   # links @deepseek-ai/* from a DSH harness
pnpm build
pnpm pack
dsh plugin --profile web add ./dsh-record-replay-0.3.0.tgz
```

## Gating (dsh-tool-lazy-gate)

The skill registers with `invocation: { modelInvocable: false, userInvocable:
true }` and publishes the association the lazy gate discovers:

```ts
metadata: { 'dsh:gate': { toolPrefixes: ['orr_'], promptSections: [] } }
```

Wire it up in the profile's gate config:

```yaml
capabilities:
  recorder:
    enabled: true
    skillNames: [open-record-replay]
```

While locked, the `orr_*` tools are hidden from the model catalog *and* rejected
at execution, so a recording cannot start unless the user asks for one. That
matters because `orr_record_start` installs a global keyboard hook that captures
typed text verbatim.

**Unlock by typing `/open-record-replay`.** That gesture is the only unlock
path: a model call to the skill tool produces a `tool/call`, which the gate
never treats as an unlock. The practical consequence is that a plain-language
request ("record me doing X") does **not** activate recording — the gesture is
required. Drop the gate config if you prefer model-initiated use, and accept
that only the tool descriptions then constrain when recording starts.

Without this metadata the gate silently drops the configured `skillNames` and
the capability never engages, so the association is required rather than
optional. `tests/register.spec.ts` asserts the contract.

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `cliPath` | env `ORR_CLI_PATH` | Explicit path to `bin/orr.js`. Overrides `repoRoot`. |
| `repoRoot` | env `ORR_REPO_ROOT` | Path to an open-record-replay checkout; the CLI is `<repoRoot>/bin/orr.js`. |
| `runsOut` | `runs` | Workspace-relative recordings directory. |
| `skillInputsOut` | `skill-inputs` | Workspace-relative skill-input packages directory. |

The CLI runs with the session workspace as its working directory, so recordings
and skill packages land where the agent's filesystem tools can read them.

## Tools

| Tool | CLI mapping | Purpose |
|---|---|---|
| `orr_permissions_check` | `permissions check` | Verify Accessibility / Input Monitoring before recording. |
| `orr_record_start` | `record start` | Begin capturing the user's demonstration. |
| `orr_record_stop` | `record stop` | Finalize the session after the user finishes. |
| `orr_session_events` | `session events` | Read the evidence stream (`events.jsonl`), capped at `limit` events. |
| `orr_session_validate` | `session validate-recording` | Check the recording against the official contract. |
| `orr_skill_prepare` | `skill prepare` | Build the evidence package for the host skill creator. |
| `orr_skill_create` | — (built-in) | **Built-in skill creation fallback.** Generates a SKILL.md skeleton from a recorded session following the [Anthropic skills spec](https://github.com/anthropics/skills) (kebab-case name + description frontmatter, progressive-disclosure body, `evals/evals.json`), validates agent-authored drafts, and installs to `~/.agents/skills/<name>/`. Prefer a host-native Skill Creator when one exists; this is the fallback. |

## Development

```bash
pnpm install
node scripts/link-dsh.mjs    # links @deepseek-ai/* from a DSH checkout/harness
pnpm build                   # tsc
pnpm test                    # vitest
pnpm validate                # build + test
```

Tests assert the registration contract and exercise the CLI runner through a
stubbed subprocess service; `node scripts/link-dsh.mjs --path <dir>` points the
`@deepseek-ai` scope at an explicit DSH checkout.

## License

MIT — see [LICENSE](./LICENSE).
