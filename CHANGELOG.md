# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-10

Fork of `humblebanana/dsh-record-replay` (base 0.2.0), maintained at
`LiuRJ99/dsh-record-replay`.

### Added

- `dsh-tool-lazy-gate` association: the skill now publishes
  `metadata['dsh:gate']` with `toolPrefixes: ['orr_']`, so a host running the
  lazy gate can hide and execution-block the whole `orr_*` family until the
  user unlocks it.
- Registration-contract tests covering the gate association: user-only
  invocation, prefix coverage of every registered tool, and a gesture-typable
  skill name. Each guards a silent failure mode — a gate that cannot associate
  the skill drops the capability without an error, and an untypable skill name
  would lock the capability with no way to lift it.

### Changed

- **Breaking for model-initiated use:** the skill is now
  `invocation: { modelInvocable: false, userInvocable: true }`. Only a
  user-explicit `/open-record-replay` gesture unlocks the capability; a
  model-initiated `skill()` call produces only a `tool/call`, which the gate
  never treats as an unlock. Natural-language requests no longer activate
  recording.
- Skill `description` / `whenToUse` rewritten for the human who types the
  gesture, since the skill is no longer advertised to a model catalog.
- `lib/` is committed rather than ignored. pnpm >= 10 blocks lifecycle scripts
  of git-hosted dependencies unless the consumer allowlists them, so a
  `github:` install ships no build output otherwise.
- `@deepseek-ai/dsh-util-values` declared as a peer dependency.

### Fixed

- **Build failure on DSH >= 0.1.2-rc.1:** `JsonValue` is no longer re-exported
  from `@deepseek-ai/dsh-tools` (it moved to `@deepseek-ai/dsh-util-values` in
  0.1.2-rc.1), so `src/runner.ts` and `src/tools.ts` failed to typecheck.

## [0.2.0] - 2026-08-13

### Added

- Built-in skill creation fallback: `orr_skill_create` tool.
  - Reads a recorded session's `events.jsonl` and extracts a compact semantic
    summary (apps, window titles, URLs, action counts, semantic actions).
  - Generates a spec-shaped SKILL.md skeleton following the Anthropic skills
    spec (github.com/anthropics/skills — skill-creator): kebab-case `name`,
    `description` frontmatter, progressive-disclosure body
    (triggering / workflow / input-output / verification / privacy).
  - Validates final drafts (frontmatter `name` + `description`, body) before
    installing to `~/.agents/skills/<name>/SKILL.md` with an
    `evals/evals.json` placeholder.
  - Host-native Skill Creator remains the preferred path; `orr_skill_create`
    is used when the host has none.

## [0.1.0] - 2026-08-13

### Added

- `dsh-record-replay` bundle: `cordis.patch.yml` + TypeScript host plugin.
- `open-record-replay` skill registration (`source: runtime`).
- Six model-facing tools: `orr_permissions_check`, `orr_record_start`,
  `orr_record_stop`, `orr_session_events`, `orr_session_validate`,
  `orr_skill_prepare`.
- CLI resolution via `cliPath` / `repoRoot` / `ORR_CLI_PATH` / `ORR_REPO_ROOT`.
- Subprocess-service invocation with bounded output and cancellation.
- Registration-contract and runner unit tests.
