---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview
Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests
**Before presenting options, verify tests pass:**
```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```
**If tests fail:** fix before completing.

### Step 2: Determine Base Branch
```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```
Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options
Present exactly these 4 options:
1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

### Step 4: Execute Choice
#### Option 1: Merge Locally
`git checkout <base-branch> && git pull && git merge <feature-branch> && <test command> && git branch -d <feature-branch>`

#### Option 2: Push and Create PR
`git push -u origin <feature-branch> && gh pr create --title "<title>" --body "..."`

#### Option 4: Discard
**Confirm first:** Type 'discard' to confirm. Then: `git checkout <base-branch> && git branch -D <feature-branch>`

### Step 5: Cleanup Worktree
Check if in worktree: `git worktree list | grep $(git branch --show-current)`. If yes: `git worktree remove <worktree-path>`.

## Quick Reference
| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |
