/** Resolve and invoke the Open Record/Replay CLI through the harness subprocess service. */
import type { Context } from '@deepseek-ai/cordis';
import type { JsonValue } from '@deepseek-ai/dsh-util-values';
import type { ResolvedRecordReplayConfig } from './config.ts';
/** Resolve the ORR CLI path from config (cliPath, then repoRoot) then environment, failing loud when absent. */
export declare function resolveCliPath(config: ResolvedRecordReplayConfig): string;
/** Confirm the resolved CLI exists so a bad path fails at plugin load, not at first tool call. */
export declare function validateCli(cliPath: string): string;
/** Settled result of one CLI invocation. */
export interface OrrResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}
/**
 * Run `node <cliPath> <args>` once with bounded output collection and
 * cancellation. The caller's deadline (`timeoutMs`) and the tool-call signal
 * both start the subprocess-service termination escalation when they fire.
 */
export declare function runOrr(ctx: Context, cliPath: string, cwd: string, args: readonly string[], signal: AbortSignal | undefined, timeoutMs: number): Promise<OrrResult>;
/** Run the CLI and parse JSON stdout into a model-visible object, falling back to raw text. */
export declare function runOrrJson(ctx: Context, cliPath: string, cwd: string, args: readonly string[], signal: AbortSignal | undefined, timeoutMs: number): Promise<Record<string, JsonValue>>;
//# sourceMappingURL=runner.d.ts.map