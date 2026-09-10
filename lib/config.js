/** Validated configuration for the dsh-record-replay bundle. */
import z from '@deepseek-ai/schemastery';
/** Configuration schema used by Cordis. */
export const Config = z.object({
    cliPath: z.string(),
    repoRoot: z.string(),
    runsOut: z.string().default('runs'),
    skillInputsOut: z.string().default('skill-inputs'),
});
/** Fail-fast configuration error, surfaced as a loud plugin-load failure. */
export class RecordReplayConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RecordReplayConfigError';
    }
}
/** Accept only a non-empty workspace-relative path without `..` traversal. */
function workspaceRelative(name, value) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        throw new RecordReplayConfigError(`${name} must be a non-empty workspace-relative path`);
    }
    if (trimmed.startsWith('/') || /^[A-Za-z]:[\\/]/.test(trimmed)) {
        throw new RecordReplayConfigError(`${name} must be workspace-relative (no absolute paths): ${trimmed}`);
    }
    if (trimmed.split(/[\\/]+/u).includes('..')) {
        throw new RecordReplayConfigError(`${name} must not contain '..': ${trimmed}`);
    }
    return trimmed;
}
/** Normalize raw config into runtime values. */
export function resolveConfig(config = {}) {
    return {
        ...(config.cliPath !== undefined ? { cliPath: config.cliPath.trim() } : {}),
        ...(config.repoRoot !== undefined ? { repoRoot: config.repoRoot.trim() } : {}),
        runsOut: workspaceRelative('runsOut', config.runsOut ?? 'runs'),
        skillInputsOut: workspaceRelative('skillInputsOut', config.skillInputsOut ?? 'skill-inputs'),
    };
}
//# sourceMappingURL=config.js.map