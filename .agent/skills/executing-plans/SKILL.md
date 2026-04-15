---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview
Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. If subagents are available, use **superpowers:subagent-driven-development** instead of this skill.

## The Process
1. **Load and Review Plan**: Read plan file, identify concerns, create TodoWrite.
2. **Execute Tasks**: Mark as in_progress, follow steps exactly, run verifications, mark as completed.
3. **Complete Development**: After all tasks verified, use **superpowers:finishing-a-development-branch**.

## When to Stop and Ask for Help
STOP immediately when:
- Hit a blocker (missing dependency, test fails).
- Plan has critical gaps.
- Verification fails repeatedly.
Ask for clarification rather than guessing.

## Remember
- Review plan critically first.
- Follow plan steps exactly.
- Don't skip verifications.
- Reference skills when plan says to.
- Never start implementation on main/master branch without explicit user consent.
