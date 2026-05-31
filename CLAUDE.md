# Agent Instructions

## Questions vs. Actions

**STOP and ASK before making changes based on questions.**

**Question indicators** (EXPLAIN only, do NOT change code):
- "Why did you...?" / "How does X work?" / "Can you explain...?"
- "What happens when...?" / "Does the logic allow for...?"

**Request indicators** (OK to make changes):
- "Please change..." / "Update X to..." / "Fix..." / "Add..."
- After explicit confirmation: "Yes, do it" / "Go ahead" / "Make that change"

**When in doubt:** explain current behavior, ask "Would you like me to change this?", wait for confirmation.

---

## Basic project facts

- Browser-based implementation of Cadaco All-Star Baseball (1960s tabletop game)
- Vanilla JS with ES modules (no bundler), SVG rendering, GSAP for animation
- No heavy frameworks (React, Angular, Vue) unless explicitly approved
- Full automation only: avoid features requiring manual curation
- Game rules reference: `docs/cadaco-allstar-baseball-rules.md`
- Implementation plan: `docs/plans/2026-05-31-core-game.md`

## Running the project

- **Dev server:** `npm run dev` (Python http.server on port 8080)
- **Unit tests:** `npm test` (Vitest)
- **E2E tests:** `npm run test:e2e` (Playwright)
- **Live site:** https://slowernet.github.io/jonron/ (deploys from main via GitHub Pages)

## Priority when instructions conflict

1. Working code over perfect code
2. Conciseness over comprehensiveness
3. Standards compliance over personal preference

## Disagreement and pushback

When you have a reasoned counterargument, state it clearly before accepting my decision. Don't just fold. Sycophantic agreement is not helpful.

---

## Development methodology (Superpowers)

### Brainstorming (design-first)

Every feature goes through design before implementation, no matter how small.

1. Ask clarifying questions (one per message, prefer multiple-choice)
2. Propose 2-3 approaches with trade-offs and a recommendation
3. Present design sections with approval checkpoints
4. **Hard gate:** no coding, scaffolding, or implementation until design is approved

### Writing plans

For multi-step work, create implementation plans before coding:

- Break work into bite-sized tasks (2-5 minutes each) with exact file paths
- Follow TDD approach: failing test -> implementation -> passing test -> commit
- Include complete code blocks, never placeholders like "TBD" or "add validation"
- Apply DRY/YAGNI throughout
- Store plans in `docs/plans/`

### Test-driven development

**Non-negotiable: write tests first, watch them fail, then implement.**

The cycle:
1. **RED** - Write a failing test demonstrating desired behavior
2. **GREEN** - Write the simplest code to pass the test
3. **REFACTOR** - Improve code quality while keeping tests green

Rules:
- No production code without a preceding failing test
- If you didn't watch the test fail, you don't know if it tests the right thing
- Use real code in tests; avoid mocks when possible
- Reject rationalizations like "I'll test after" or "this is too simple to test"

### Subagent-driven development

For larger tasks, delegate to fresh subagents per task:

- Each subagent gets isolated context (not session history)
- Two-stage review after each task: spec compliance first, then code quality
- Never skip reviews or accept "close enough" on spec compliance
- Use appropriate model capability per role (fast for mechanical, capable for architecture)

### Systematic debugging

**No fixes without root cause investigation first.**

1. **Investigate** - Read errors, reproduce consistently, examine recent changes
2. **Analyze patterns** - Find working examples, compare implementations, identify differences
3. **Hypothesize and test** - Form explicit theories, test with minimal changes, one variable at a time
4. **Implement** - Write failing test, apply single targeted fix, verify

**Escalation rule:** if three or more fix attempts fail, stop and question whether the architecture itself is flawed.

### Code review

Review early, review often. Mandatory after completing tasks and before merging.

- Critical issues: fix immediately
- Important issues: fix before proceeding
- Minor issues: document for later
- Respectfully challenge feedback if you have technical justification

---

## Git operations

**No git state changes without explicit user approval.** "Should I commit?" is not approval.

**Forbidden without explicit approval:**
- `git commit` (especially `--amend`)
- `git push`, `git checkout`/`git switch`, `git reset`/`git restore`
- `git clean`, `git stash`, `git rebase`, `git merge`

**Allowed without asking:**
- `git status`, `git diff`, `git log` (read-only)

---

## Code standards

### General

- Favor simplicity, fewer dependencies, concise code
- Make only the changes needed to accomplish the stated goal
- Avoid rewriting/restructuring working code unnecessarily
- Comments: only when something non-obvious is happening
- Avoid emojis in code or markdown files
- Use sentence case for headers in Markdown

### JavaScript

- No heavy libraries/frameworks
- No semicolons except when required (line starts with `[`, `(`, `` ` ``, `+`, `-`, `/`); use leading semicolon for IIFEs
- Arrow functions preferred: `() => {}` over `function()`
- Use `const`/`let`, never `var`
- Template literals for interpolation, single quotes otherwise
- Prefer destructuring, spread operators, optional chaining (`?.`), nullish coalescing (`??`)
- Ternaries and guard clauses over nested if/else
- `async`/`await` over `.then()` chains
- All external JS loaded with `defer`
- All inline JS wrapped in a `DOMContentLoaded` event listener

### HTML/CSS

- Semantic HTML elements where appropriate
- Prefer CSS custom properties for theming/shared values
- Mobile-first responsive design

### Code consistency checks

Before completing any code changes, proactively check for:

- Naming convention consistency within the same file
- Return value patterns matching similar methods
- Error handling matching patterns used in the same module

When you notice an inconsistency, mention it and ask if I want it fixed.

---

## Communication style

- Be polite, friendly, and direct
- Limit cheerleading phrases
- Tell me when ideas are flawed, incomplete, or poorly thought through
- Use multiple choice questions to flesh out specs and resolve ambiguity
- For larger tasks, ask questions until 95% sure what to do, then make a plan and summarize it
