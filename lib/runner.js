/** Resolve and invoke the Open Record/Replay CLI through the harness subprocess service. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { RecordReplayConfigError } from "./config.js";
const STDOUT_MAX_BYTES = 16 * 1024 * 1024;
const STDERR_MAX_BYTES = 256 * 1024;
/** Resolve the ORR CLI path from config (cliPath, then repoRoot) then environment, failing loud when absent. */
export function resolveCliPath(config) {
    if (config.cliPath !== undefined && config.cliPath.trim() !== '')
        return config.cliPath.trim();
    if (config.repoRoot !== undefined && config.repoRoot.trim() !== '')
        return path.join(config.repoRoot.trim(), 'bin', 'orr.js');
    const envCli = process.env.ORR_CLI_PATH;
    if (envCli !== undefined && envCli.trim() !== '')
        return envCli.trim();
    const envRoot = process.env.ORR_REPO_ROOT;
    if (envRoot !== undefined && envRoot.trim() !== '')
        return path.join(envRoot.trim(), 'bin', 'orr.js');
    throw new RecordReplayConfigError('dsh-record-replay needs an open-record-replay CLI: set config.cliPath (path to bin/orr.js) '
        + 'or config.repoRoot (path to an open-record-replay checkout), or ORR_CLI_PATH / ORR_REPO_ROOT.');
}
/** Confirm the resolved CLI exists so a bad path fails at plugin load, not at first tool call. */
export function validateCli(cliPath) {
    if (!existsSync(cliPath)) {
        throw new RecordReplayConfigError(`dsh-record-replay CLI not found: ${cliPath}`);
    }
    return cliPath;
}
function readOutput(read) {
    return read === undefined ? '' : read.text;
}
/**
 * Run `node <cliPath> <args>` once with bounded output collection and
 * cancellation. The caller's deadline (`timeoutMs`) and the tool-call signal
 * both start the subprocess-service termination escalation when they fire.
 */
export async function runOrr(ctx, cliPath, cwd, args, signal, timeoutMs) {
    const deadline = AbortSignal.timeout(timeoutMs);
    const combined = signal === undefined ? deadline : AbortSignal.any([signal, deadline]);
    const handle = ctx.subprocess.spawn({
        argv: [process.execPath, cliPath, ...args],
        cwd,
        stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: STDOUT_MAX_BYTES },
            stderr: { maxBytes: STDERR_MAX_BYTES },
        },
        graceMs: 1000,
        signal: combined,
        env: {},
    });
    const outcome = await handle.done;
    return {
        exitCode: outcome.exitCode,
        stdout: readOutput(handle.collected.stdout?.readFrom(0)),
        stderr: readOutput(handle.collected.stderr?.readFrom(0)),
        timedOut: deadline.aborted,
    };
}
/** Run the CLI and parse JSON stdout into a model-visible object, falling back to raw text. */
export async function runOrrJson(ctx, cliPath, cwd, args, signal, timeoutMs) {
    const result = await runOrr(ctx, cliPath, cwd, args, signal, timeoutMs);
    if (result.exitCode !== 0 && result.stdout.trim().length === 0) {
        throw new Error(`orr ${args.join(' ')} failed: ${result.stderr.trim().slice(0, 1000) || `exit code ${String(result.exitCode)}`}`);
    }
    if (result.exitCode !== 0 && result.stdout.trim().length > 0) {
        // The CLI prints structured errors on non-zero exits; keep them model-visible.
        try {
            const parsed = JSON.parse(result.stdout);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))
                return parsed;
            return { raw: parsed };
        }
        catch {
            throw new Error(`orr ${args.join(' ')} failed: ${result.stdout.trim().slice(0, 1000)}`);
        }
    }
    try {
        const parsed = JSON.parse(result.stdout);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))
            return parsed;
        return { raw: parsed };
    }
    catch {
        return { raw_stdout: result.stdout };
    }
}
//# sourceMappingURL=runner.js.map