# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
