# Contributing

Thanks for helping improve `dsh-record-replay`.

## Setup

```bash
pnpm install
node scripts/link-dsh.mjs --path /path/to/deepseek-harness/profiles/node_modules/@deepseek-ai
pnpm build
pnpm test
```

`pnpm validate` runs the build and test suite. The `@deepseek-ai/*` packages are
peers — link them from a DeepSeek Harness checkout or a harness home
(`$DSH_HOME/profiles/node_modules/@deepseek-ai`) for local type-checking and tests.

## Conventions

- The plugin is a Cordis **namespace plugin**: named `name` / `inject` / `Config`
  / `apply` exports with **no** `export default` (a default export makes the
  Loader's `unwrapExports` discard `inject` and `Config`).
- Register capabilities as effects (`ctx.tools.register`, `ctx.skills.register`)
  so hot reload and plugin unload reverse them.
- Prefer the harness subprocess service over raw `child_process` for running the
  CLI, and bound collected output.
- Add a registration-contract test for any new model-facing tool.

## License

By contributing you agree your contribution is licensed under the project's MIT
license.
