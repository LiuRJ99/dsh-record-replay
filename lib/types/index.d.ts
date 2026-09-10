/** dsh-record-replay: DeepSeek Harness bundle for the Open Record/Replay macOS workflow recorder. */
import type { Context } from '@deepseek-ai/cordis';
import { type RecordReplayConfig } from './config.ts';
export { Config } from './config.ts';
export type { RecordReplayConfig, ResolvedRecordReplayConfig } from './config.ts';
export { resolveCliPath } from './runner.ts';
export { RECORD_REPLAY_SKILL, RECORD_REPLAY_SKILL_CONTENT, RECORD_REPLAY_SKILL_NAME } from './skill.ts';
export { createRecordReplayTools } from './tools.ts';
/** Plugin display name used in diagnostics. */
export declare const name = "record-replay";
/**
 * Required services: the tool registry, the skill registry, and the subprocess
 * service that runs the ORR CLI. All three ship in the dsh-base bundle.
 */
export declare const inject: readonly ["tools", "skills", "subprocess"];
/**
 * Register the `open-record-replay` skill and the six `orr_*` tools. Synchronous:
 * every registration is a reversible effect on the calling fiber, so a later
 * failure (or a hot reload) unwinds them.
 */
export declare function apply(ctx: Context, config?: RecordReplayConfig): void;
//# sourceMappingURL=index.d.ts.map