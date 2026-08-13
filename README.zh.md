# dsh-record-replay

把 [Open Record/Replay](https://github.com/humblebanana/open-record-replay)（macOS
桌面工作流录制器）接入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
的插件。

它注册 **`open-record-replay` skill** 和 **6 个面向模型的 `orr_*` 工具**，让 Agent
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

## 环境要求

- macOS（原生录制器是 Swift，需要 Xcode Command Line Tools）。
- Node.js `>= 22.19`（Harness 运行时）。
- 已安装 DeepSeek Harness。
- 一个 [open-record-replay](https://github.com/humblebanana/open-record-replay)
  检出目录，插件调用其 `bin/orr.js`。

## 安装

```bash
git clone https://github.com/<you>/dsh-record-replay.git
cd dsh-record-replay
pnpm install
pnpm build
pnpm pack                      # 生成 dsh-record-replay-0.1.0.tgz
dsh plugin --profile web add ./dsh-record-replay-0.1.0.tgz
```

`dsh plugin add` 会写入 profile 的 `package.json`（dependencies + `dsh.profile.bundles`），
并由 harness 维护 `profiles/node_modules` 符号链接。随后在 profile 的 `cordis.patch.yml`
里叠加该行、指向你的检出目录：

```yaml
- id: record-replay
  config:
    repoRoot: '/absolute/path/to/open-record-replay'
    runsOut: 'runs'
    skillInputsOut: 'skill-inputs'
```

profile patch 文件会被热加载，运行中的 GUI 无需重启即可生效。

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

## 开发

```bash
pnpm install
node scripts/link-dsh.mjs    # 从 DSH 检出/harness 链接 @deepseek-ai/*
pnpm build                   # tsc
pnpm test                    # vitest
pnpm validate                # build + test
```

## License

MIT —— 见 [LICENSE](./LICENSE)。
