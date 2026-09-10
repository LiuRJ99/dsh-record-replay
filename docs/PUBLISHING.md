# Publishing

How to publish `dsh-record-replay` to GitHub and list it under the
[`dsh-plugin`](https://github.com/topics/dsh-plugin) topic.

## Prerequisites

- A GitHub account.
- Git configured (`git config user.name` / `user.email`).
- Optional but recommended: the [GitHub CLI](https://cli.github.com/) (`gh`),
  authenticated with `gh auth login`.

## 1. Create the repository

Web UI:

1. Go to <https://github.com/new>.
2. Name it `dsh-record-replay` (match the package name).
3. Set **Public**.
4. Do **not** initialize with a README/.gitignore/license — this repo already
   has them.
5. Click **Create repository**.

CLI:

```bash
gh repo create dsh-record-replay --public --source . --remote origin --push
```

## 2. Push

Web-created repo:

```bash
git remote add origin https://github.com/<you>/dsh-record-replay.git
git push -u origin main
```

If your default branch is `master`, use `master` instead.

## 3. Add the `dsh-plugin` topic

This is what lists the repo on <https://github.com/topics/dsh-plugin>.

Web UI:

1. Open the repo page → click the **gear / "About"** area on the right.
2. Under **Topics**, add `dsh-plugin` (plus, e.g., `deepseek-harness`,
   `record-replay`, `computer-use`, `macos`).
3. Save.

CLI:

```bash
gh repo edit <you>/dsh-record-replay --add-topic dsh-plugin --add-topic deepseek-harness
```

Verify it appears: <https://github.com/topics/dsh-plugin>.

## 4. (Optional) Publish to npm

```bash
pnpm publish --access public
```

`prepack` runs `pnpm build` first, so the tarball always carries a fresh
`lib/`. Consumers install it with:

```bash
dsh plugin --profile web add dsh-record-replay
```

then overlay the config row (see the README) to point `repoRoot` / `cliPath` at
their open-record-replay checkout.

## 5. Release checklist

- [ ] `pnpm validate` passes (build + tests).
- [ ] Version bumped in `package.json` and `CHANGELOG.md` updated.
- [ ] `git tag v0.1.0` and `git push --tags`.
- [ ] GitHub release notes published for the tag.
- [ ] Topic `dsh-plugin` set on the repo.

## Notes for consumers

`dsh-record-replay` is a Harness bundle, not a standalone program. It requires:

- A DeepSeek Harness installation.
- macOS (the Open Record/Replay native recorder is Swift).
- An open-record-replay checkout whose `bin/orr.js` the plugin invokes
  (configured via `repoRoot` or `cliPath`). Use the
  [LiuRJ99 fork](https://github.com/LiuRJ99/open-record-replay), not upstream:
  upstream resolves its Swift package against `process.cwd()`, which fails for
  every tool call when the CLI runs with the session workspace as cwd.
