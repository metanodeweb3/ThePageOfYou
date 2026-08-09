# AGENTS.md

## Code Modification Rules
- **ALWAYS ask for explicit user confirmation before editing or modifying any code or files in the project.**
- Do not make speculative or automatic code edits without prior approval.

## API Cost Transparency & Notification Rules
- **WARN BEFORE TESTING**: Always inform the user and obtain explicit approval before running test scripts, executing automated requests, or triggering live API calls that consume paid tokens.
- **COST ESTIMATES**: Provide estimated token usage and cost impact before introducing multi-model fallback sequences, expanding prompt sizes, or running test suites.
- **COST-EFFICIENT GUARDRAILS**: Always enforce response caching, strict `maxOutputTokens` capping, and prioritize efficient models (`gemini-3.1-flash-lite` / `gemini-2.5-flash`) for fallback paths.
- **MONTHLY ALLOWANCE & PAY-PER-REQUEST NOTIFICATION**: ALWAYS clearly notify the user across any and all projects created on Google AI Studio if monthly allowance usage has run out and/or if switching to or using a Gemini Pay-Per-Request model.

