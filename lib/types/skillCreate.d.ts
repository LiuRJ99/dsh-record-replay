/**
 * Built-in skill creation for dsh-record-replay.
 *
 * Generates skills that follow the Anthropic skills spec
 * (https://github.com/anthropics/skills — skill-creator):
 *
 *   skill-name/
 *   ├── SKILL.md            (frontmatter: name + description required)
 *   ├── references/         (optional docs)
 *   ├── scripts/            (optional deterministic code)
 *   ├── assets/             (optional output templates)
 *   └── evals/evals.json    (optional test cases)
 *
 * The deterministic parts (evidence summarization, skeleton generation,
 * frontmatter validation, install) live here as host-side tool logic; the
 * semantic parts (final description, step wording) are written by the calling
 * agent from the evidence summary, mirroring how the Anthropic skill-creator
 * works. If the host has a native Skill Creator skill, use it instead of this
 * fallback.
 */
/** One semantic action extracted from the evidence stream. */
export interface EvidenceAction {
    kind: string;
    app?: string;
    semantic?: string;
}
/** Compact, model-usable summary of one recording session. */
export interface SkillEvidenceSummary {
    sessionId: string;
    startedAt?: string;
    endedAt?: string;
    durationMs?: number;
    apps: string[];
    windowTitles: string[];
    urls: string[];
    actionCounts: Record<string, number>;
    actions: EvidenceAction[];
}
/** Extract a compact semantic summary from an events.jsonl stream (AX full trees are skipped). */
export declare function summarizeEvidence(eventsPath: string): SkillEvidenceSummary;
/** Validate a skill name against the kebab-case rule; returns an error string or null. */
export declare function validateSkillName(name: string): string | null;
/** Validate a full SKILL.md draft; returns a list of problems (empty = OK). */
export declare function validateSkillDraft(name: string, draft: string): string[];
/**
 * Build a SKILL.md skeleton from evidence, following the Anthropic skills
 * anatomy: frontmatter (name/description) + progressive-disclosure body
 * (triggering, workflow, input/output, verification, privacy).
 */
export declare function generateSkillSkeleton(summary: SkillEvidenceSummary, name: string, description?: string): string;
export interface InstallSkillOptions {
    target: string;
    name: string;
    content: string;
    overwrite: boolean;
}
export interface InstallSkillResult {
    skillPath: string;
    existed: boolean;
    evalsPath?: string;
}
/** Install one SKILL.md into `<target>/<name>/SKILL.md` (optionally creating an evals placeholder). */
export declare function installSkill(options: InstallSkillOptions): InstallSkillResult;
/** Resolve the skill install directory: absolute, or relative to `cwd`. Defaults to `~/.agents/skills`. */
export declare function resolveSkillTarget(target: string | undefined, cwd: string): string;
//# sourceMappingURL=skillCreate.d.ts.map