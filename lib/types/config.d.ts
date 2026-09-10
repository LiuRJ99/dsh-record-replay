/** Validated configuration for the dsh-record-replay bundle. */
import type Schema from '@deepseek-ai/schemastery';
/** User-facing configuration. Path fields are optional; the CLI resolver and environment provide fallbacks. */
export interface RecordReplayConfig {
    /** Explicit path to an open-record-replay `bin/orr.js` (or a compatible CLI). */
    cliPath?: string;
    /** Path to an open-record-replay checkout; the CLI is `<repoRoot>/bin/orr.js`. */
    repoRoot?: string;
    /** Workspace-relative recordings directory. Defaults to `runs`. */
    runsOut?: string;
    /** Workspace-relative skill-input packages directory. Defaults to `skill-inputs`. */
    skillInputsOut?: string;
}
/** Fully normalized configuration consumed at runtime. */
export interface ResolvedRecordReplayConfig {
    cliPath?: string;
    repoRoot?: string;
    runsOut: string;
    skillInputsOut: string;
}
/** Configuration schema used by Cordis. */
export declare const Config: Schema<RecordReplayConfig>;
/** Fail-fast configuration error, surfaced as a loud plugin-load failure. */
export declare class RecordReplayConfigError extends Error {
    constructor(message: string);
}
/** Normalize raw config into runtime values. */
export declare function resolveConfig(config?: RecordReplayConfig): ResolvedRecordReplayConfig;
//# sourceMappingURL=config.d.ts.map