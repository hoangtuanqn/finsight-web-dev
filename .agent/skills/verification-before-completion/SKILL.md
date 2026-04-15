---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview
Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

## The Iron Law
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## The Gate Function
BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command.
3. READ: Full output, check exit code.
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim.

## Red Flags - STOP
- Using "should", "probably", "seems to".
- Expressing satisfaction before verification ("Great!", "Done!", etc.).
- Trusting agent success reports without verification.

## Key Patterns
- **Tests**: Run test command. See passing results.
- **Regression tests**: Verify Red-Green cycle.
- **Build**: Run build command. See exit 0.
- **Requirements**: Re-read plan, create checklist, verify each.

## Why This Matters
Verification prevents shipping broken or incomplete features and maintains trust.
No shortcuts for verification.
