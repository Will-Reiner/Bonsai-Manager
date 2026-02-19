---
name: notes
description: Document what was implemented in the current session by appending an entry to .claude/NOTES.md
---

# Documentar Implementacao

Append a new entry to `.claude/NOTES.md` documenting what was implemented in this session.

## Format

```markdown
## Implementacao YYYY-MM-DD

### Resumo

One-line summary of what was done. If arguments were provided, use them as context: $ARGUMENTS

### Detalhes

Concise bullet points grouped by theme. No file lists, no verbose explanations. Focus on what changed and why.
```

## Rules

1. Read `.claude/NOTES.md` first — append to existing content, never overwrite
2. Review the git diff and recent conversation to understand what was done: !`git diff --stat HEAD~5 2>/dev/null || git diff --stat`
3. Use the date of today
4. Keep it short — the summary is 1 sentence, the details are grouped bullet points
5. No file paths unless critical. No package lists unless something new was installed.
6. Write in Portuguese (without accents in the markdown, matching existing style)
7. After appending to NOTES.md, read `CLAUDE.md` and mark any TODO items that were completed in this session by appending ` - DONE` to the line (e.g. `- Midia storage management` → `- Midia storage management - DONE`). Only mark items that were actually implemented.
