/** Model-facing `orr_*` tool definitions for the Open Record/Replay workflow. */
import type { Context } from '@deepseek-ai/cordis';
import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
export interface RecordReplayToolOptions {
    cliPath: string;
    runsOut: string;
    skillInputsOut: string;
}
/** Build the six model-facing tools that wrap `bin/orr.js`. */
export declare function createRecordReplayTools(ctx: Context, options: RecordReplayToolOptions): ToolDefinition[];
//# sourceMappingURL=tools.d.ts.map