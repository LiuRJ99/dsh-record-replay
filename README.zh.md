# dsh-record-replay

把 [Open Record/Replay](https://github.com/humblebanana/open-record-replay)（macOS
桌面工作流录制器）接入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
的插件。

它注册 **`open-record-replay` skill** 和 **7 个面向模型的 `orr_*` 工具**，让 Agent
通过一次真实演示学会一个 macOS 工作流：录制用户操作 → 校验证据 → 打包交给宿主 Agent
的 skill 创建流程。

```text
用户演示工作流
  -> orr_record_start         (生成 session.json + events.jsonl)
  -> orr_record_stop          (收尾)
  -> orr_session_validate     (按官方契约校验录制质量)
  -> orr_session_events       (读取用户实际做了什么)
  -> orr_skill_prepare        (打包 skill 输入目录)
  -> 宿主 skill creator
```

## 关于本 fork

这是 [humblebanana/dsh-record-replay](https://github.com/humblebanana/dsh-record-replay)
的 fork，维护于
[LiuRJ99/dsh-record-replay](https://github.com/LiuRJ99/dsh-record-replay)
（上游基线 `0.2.0`，fork 版本 `0.3.0`）。

它存在有两个理由：上游版本已无法在当前 DeepSeek Harness 上编译；本部署要求录制器
挂在会话级 lazy gate 之后，而不是模型随时可达。上游能做的一切，本 fork 仍然能做——
差异是刻意保持小且局部的：

| | 上游 `0.2.0` | 本 fork `0.3.0` |
|---|---|---|
| 在 DSH ≥ `0.1.2-rc.1` 上的 typecheck | 失败——`@deepseek-ai/dsh-tools` 不再重新导出 `JsonValue` | 从 `@deepseek-ai/dsh-util-values` 导入 `JsonValue` |
| `github:` 安装 | 不含构建产物（`lib/` 曾被 gitignore） | `lib/` 已提交，安装时不跑构建 |
| 门控后的激活方式 | 模型或用户发起 | **仅用户手势**——`/open-record-replay` |
| 门控关联 | 缺失；已配置的门控会静默丢弃该能力 | 发布 `metadata['dsh:gate']`，含 `toolPrefixes: ['orr_']` |
| 注册测试 | 23 | 26，含 3 项门控关联守护 |

门控关联是实质性的新增。锁定期间 `orr_*` 工具既从模型目录中隐藏，也在执行时被拒绝，
因此录制无法由模型自行发起。这一点在这里很重要：`orr_record_start` 会安装全局键盘钩子，
原样捕获键入文本——包括用户不慎输入的一切。配置方式与手势要求的代价见
[门控](#门控dsh-tool-lazy-gate)。

### 与上游同步

```bash
git remote add upstream https://github.com/humblebanana/dsh-record-replay.git
git fetch upstream
git merge upstream/main     # 差异很小，冲突局部化
pnpm build                  # 每次提交前必须——见下
pnpm test
```

**`lib/` 已提交，所以提交前务必重新构建。** 没有其他东西会生成它：`github:` 安装
直接消费已提交的 `lib/`，因此只改 `src/` 而不重新 `pnpm build`，会发布过期行为，
且任何地方都不报错。

如果上游哪天合入了上面两项修复，本 fork 仅剩门控关联这一项价值——而那一项也可以
直接贡献回上游，不必在这里维护。

### 必须使用录制器 fork

**用录制器 fork，不要用上游。** 本插件刻意以会话工作区为 CLI 的工作目录，好让
`runs/` 与 `skill-inputs/` 落在 Agent 文件系统工具能读取的位置。上游录制器与此不符：
`buildNativeMacOSRecorder()` 用 `path.resolve(process.cwd(), "packages/platform-macos")`
定位自己的 Swift 包，这假定 CLI 从 checkout 根目录被调用。于是每次 `orr_*` 调用都以
`error: chdir error: No such file or directory (2)` 失败——`orr_permissions_check` 和
`orr_record_start` 同样失败，所以整个工具族都不可用，不只是录制。

这是上游的真实 bug，而非假设不一致：同一文件的 `resolveRunRoot()` 有意把 `--out`
相对 cwd 解析，说明 CLI 就是*设计*成可从任意目录运行的，只有它自己的原生包查找用错了锚点。

修复由 [LiuRJ99/open-record-replay](https://github.com/LiuRJ99/open-record-replay) 承载
（`packages/core-engine/src/store.mjs` 改为从 `import.meta.url` 解析），所以请克隆它
而不是上游：

```bash
git clone https://github.com/LiuRJ99/open-record-replay.git
cd open-record-replay && npm install && npm run build:native
```

把 `repoRoot` 指向该检出目录即可。若你坚持构建上游录制器，就要手工应用该 fork 的
`ceb884a`，否则每次工具调用都会以同样方式失败。

## 环境要求

- macOS（原生录制器是 Swift，需要 Xcode Command Line Tools）。
- Node.js `>= 22.19`（Harness 运行时）。
- 已安装 DeepSeek Harness。
- 一个 [LiuRJ99/open-record-replay](https://github.com/LiuRJ99/open-record-replay)
  检出目录，插件调用其 `bin/orr.js`（见
  [必须使用录制器 fork](#必须使用录制器-fork)）。

## 安装

本 fork 提交了构建产物，因此 `github:` 安装无需构建步骤：

```bash
dsh plugin --profile web add github:LiuRJ99/dsh-record-replay#v0.3.0
```

`dsh plugin add` 会写入 profile 的 `package.json`（dependencies + `dsh.profile.bundles`）。
随包附带的 `cordis.patch.yml` 挂载的是一个中性行；请在 profile 的 `cordis.patch.yml`
里叠加该行、指向你的检出目录：

```yaml
- id: record-replay
  config:
    repoRoot: '/absolute/path/to/open-record-replay'
    runsOut: 'runs'
    skillInputsOut: 'skill-inputs'
```

**安装后需重启 Harness。** profile patch 层会被热加载，但那次重载只重新读取 patch
*文件*——它复用启动时取得的 bundle 列表快照。已经启动过、且当时未含本 bundle 的
profile，要等 `dsh web` 重启后才会挂载它。

若要从源码构建：

```bash
pnpm install
node scripts/link-dsh.mjs   # 从 DSH harness 链接 @deepseek-ai/*
pnpm build
pnpm pack
dsh plugin --profile web add ./dsh-record-replay-0.3.0.tgz
```

## 门控（dsh-tool-lazy-gate）

该 skill 以 `invocation: { modelInvocable: false, userInvocable: true }` 注册，并发布
lazy gate 会发现的关联：

```ts
metadata: { 'dsh:gate': { toolPrefixes: ['orr_'], promptSections: [] } }
```

在 profile 的门控配置中接线：

```yaml
capabilities:
  recorder:
    enabled: true
    skillNames: [open-record-replay]
```

锁定期间 `orr_*` 工具既从模型目录中隐藏，也在执行时被拒绝，因此除非用户主动要求，
录制无法开始。这一点很重要，因为 `orr_record_start` 会安装全局键盘钩子，原样捕获
键入文本。

**输入 `/open-record-replay` 解锁。** 该手势是唯一的解锁路径：模型调用 skill 工具
只会产生 `tool/call`，而门控从不把它当作解锁。实际后果是：用自然语言请求
（“录一下我做 X 的过程”）**不会**激活录制——必须用手势。若你更希望由模型发起，
删掉门控配置即可，但要接受此后只有工具描述约束录制何时开始。

没有这份元数据时，门控会静默丢弃所配置的 `skillNames`，该能力永不生效，因此这个关联
是必需项而非可选项。`tests/register.spec.ts` 断言该契约。

## 配置

| 键 | 默认 | 含义 |
|---|---|---|
| `cliPath` | 环境变量 `ORR_CLI_PATH` | 显式指定 `bin/orr.js` 路径，优先于 `repoRoot`。 |
| `repoRoot` | 环境变量 `ORR_REPO_ROOT` | open-record-replay 检出目录；CLI 为 `<repoRoot>/bin/orr.js`。 |
| `runsOut` | `runs` | 工作区相对录制目录。 |
| `skillInputsOut` | `skill-inputs` | 工作区相对 skill 输入包目录。 |

CLI 以会话工作区为工作目录运行，因此录制产物与 skill 包落在 Agent 的文件系统工具可见的位置。

## 工具

| 工具 | CLI 映射 | 用途 |
|---|---|---|
| `orr_permissions_check` | `permissions check` | 录制前校验 Accessibility / Input Monitoring 权限。 |
| `orr_record_start` | `record start` | 开始捕获用户演示。 |
| `orr_record_stop` | `record stop` | 用户演示结束后收尾。 |
| `orr_session_events` | `session events` | 读取证据流 `events.jsonl`，按 `limit` 截断。 |
| `orr_session_validate` | `session validate-recording` | 按官方契约校验录制。 |
| `orr_skill_prepare` | `skill prepare` | 打包证据目录，交给宿主 skill creator。 |
| `orr_skill_create` | —（内置） | **内置 skill 创建兜底。** 从录制会话生成符合 [Anthropic skills 规范](https://github.com/anthropics/skills) 的 SKILL.md 骨架（kebab-case 名称 + description frontmatter、渐进披露正文、`evals/evals.json`），校验 Agent 撰写的草稿，并安装到 `~/.agents/skills/<name>/`。有宿主原生 Skill Creator 时优先用它；本工具是兜底。 |

## 开发

```bash
pnpm install
node scripts/link-dsh.mjs    # 从 DSH 检出/harness 链接 @deepseek-ai/*
pnpm build                   # tsc
pnpm test                    # vitest
pnpm validate                # build + test
```

测试断言注册契约，并通过打桩的 subprocess 服务演练 CLI runner；
`node scripts/link-dsh.mjs --path <dir>` 可把 `@deepseek-ai` scope 指向显式的 DSH 检出。

## License

MIT —— 见 [LICENSE](./LICENSE)。
