/** Deployment-level `open-record-replay` Skill registration. */
export const RECORD_REPLAY_SKILL_NAME = 'open-record-replay';
export const RECORD_REPLAY_SKILL_CONTENT = `# Open Record/Replay

Use this capability to learn a user-demonstrated macOS workflow: record the
user's real desktop actions into structured evidence, then turn that evidence
into a reusable skill. If the host has a native Skill Creator, hand the
evidence package to it; otherwise use the built-in \`orr_skill_create\` flow
(which follows the Anthropic skills spec) as the fallback.

## Workflow

1. Check permissions first with the \`orr_permissions_check\` tool. The first
   call may take a few minutes because it compiles the Swift recorder.
2. Start recording only when the user is ready with \`orr_record_start\`. After
   it starts, STOP the turn and ask the user to perform the workflow and tell
   you when they are done — do not poll or loop.
3. When the user says they are done, call \`orr_record_stop\`.
4. Validate the evidence with \`orr_session_validate\`.
5. Read \`orr_session_events\` to understand what the user actually did
   (app/window attribution, mouse.click, mouse.drag, keyboard.text_input,
   keyboard.submit, selection.changed, accessibility context).
6. Create the skill:
   - If the host has a native Skill Creator skill, package the evidence with
     \`orr_skill_prepare\` and hand the returned directory to it.
   - Otherwise use the built-in fallback \`orr_skill_create\`: call it once
     without \`draft\` to generate a spec-shaped skeleton from the evidence,
     rewrite the SKILL.md (final description, steps, verification, privacy),
     then call it again with the finished body as \`draft\` to validate and
     install it. The generated skill follows the Anthropic skills spec
     (github.com/anthropics/skills): kebab-case \`name\`, a \`description\` that
     states when to trigger and what it does, a progressive-disclosure body,
     and an optional \`evals/evals.json\`.
7. Do not stop at a summary or a Markdown runbook unless the user explicitly
   asks for only that.

## Interpreting events

Treat events.jsonl as the primary evidence. Do not infer unsupported actions
from generic targets such as AXGroup, AXScrollArea, or low-confidence action
clusters. If a key action or destination is ambiguous, ask the user what the
intended action was.

## Cancellation

If the user says they cancelled the recording, do not continue to skill
creation. Acknowledge that no skill will be created from that recording.

## Privacy

Do not include sensitive values from recorded events in summaries or generated
skills. Treat passwords, OTPs, API keys/tokens, financial or identity numbers,
private personal/medical/legal/customer data, and private local paths or
document names as sensitive. Use placeholders or generic descriptions instead.
`;
export const RECORD_REPLAY_SKILL = {
    name: RECORD_REPLAY_SKILL_NAME,
    // Routing text for the HUMAN who types the gesture. This skill is gated (see
    // `invocation` below), so it is never advertised to a model skill catalog:
    // writing model-facing "use when the user asks…" guidance here would be dead
    // text, and a broad model-facing description is exactly what makes a
    // screen-recording capability look safe to reach for unprompted.
    description: 'Record a user-demonstrated macOS workflow with the Open Record/Replay CLI, '
        + 'then turn the captured evidence into a reusable skill. Invoke it yourself '
        + 'with /open-record-replay — that gesture unlocks the orr_* tools for this '
        + 'session.',
    whenToUse: 'Type /open-record-replay when you want to demonstrate a macOS desktop '
        + 'workflow so the agent can learn it. macOS only.',
    source: 'runtime',
    content: RECORD_REPLAY_SKILL_CONTENT,
    // dsh-tool-lazy-gate contract. The model can neither see nor load this skill,
    // and the orr_* tools stay hidden from the model catalog AND blocked at
    // execution until the USER explicitly types the /open-record-replay gesture.
    // A model-initiated `skill()` call produces only a tool/call, which the gate
    // deliberately never treats as an unlock — so the model cannot grant itself a
    // capability that records the user's keystrokes in plaintext.
    invocation: { modelInvocable: false, userInvocable: true },
    // Gate association published for dsh-tool-lazy-gate discovery. Without this
    // metadata the gate silently drops the configured skillNames and the
    // capability never engages, so it is required, not optional.
    metadata: {
        'dsh:gate': {
            toolPrefixes: ['orr_'],
            // This bundle registers no system-prompt section of its own, so there is
            // nothing for the gate to suppress while locked.
            promptSections: [],
        },
    },
};
//# sourceMappingURL=skill.js.map