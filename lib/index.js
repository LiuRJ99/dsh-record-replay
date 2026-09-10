/** dsh-record-replay: DeepSeek Harness bundle for the Open Record/Replay macOS workflow recorder. */
import { resolveConfig } from "./config.js";
import { resolveCliPath, validateCli } from "./runner.js";
import { RECORD_REPLAY_SKILL } from "./skill.js";
import { createRecordReplayTools } from "./tools.js";
export { Config } from "./config.js";
export { resolveCliPath } from "./runner.js";
export { RECORD_REPLAY_SKILL, RECORD_REPLAY_SKILL_CONTENT, RECORD_REPLAY_SKILL_NAME } from "./skill.js";
export { createRecordReplayTools } from "./tools.js";
/** Plugin display name used in diagnostics. */
export const name = 'record-replay';
/**
 * Required services: the tool registry, the skill registry, and the subprocess
 * service that runs the ORR CLI. All three ship in the dsh-base bundle.
 */
export const inject = ['tools', 'skills', 'subprocess'];
/**
 * Register the `open-record-replay` skill and the six `orr_*` tools. Synchronous:
 * every registration is a reversible effect on the calling fiber, so a later
 * failure (or a hot reload) unwinds them.
 */
export function apply(ctx, config = {}) {
    const resolved = resolveConfig(config);
    const cliPath = validateCli(resolveCliPath(resolved));
    ctx.skills.register(RECORD_REPLAY_SKILL);
    for (const tool of createRecordReplayTools(ctx, {
        cliPath,
        runsOut: resolved.runsOut,
        skillInputsOut: resolved.skillInputsOut,
    })) {
        ctx.tools.register(tool);
    }
}
//# sourceMappingURL=index.js.map