# Security Policy

## Reporting a vulnerability

Please report security issues privately to the repository maintainer rather than
opening a public issue. Include steps to reproduce and the affected version.

## Scope

`dsh-record-replay` runs the Open Record/Replay CLI through the Harness
subprocess service. It does not transmit recordings anywhere; captured
`events.jsonl` stays on disk and can contain sensitive content (window titles,
URLs, typed text, file names, accessibility-tree text).

Review recordings before sharing them, and never publish raw recordings that
contain secrets, private documents, customer data, internal URLs, or personal
information. The generated skill body intentionally keeps sensitive values out
of summaries and placeholders.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | :white_check_mark: |
