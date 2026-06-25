# Requirements Driven Development — Family Chores PWA MVP

## Summary

A household accountability PWA for recurring chores and one-off tasks.

Core loop: task appears → person acts → status changes → Activity records what happened.

## Roles

### Member

- View Dashboard, Week, Activity, Profile
- Create one-off task from Dashboard
- Assign one-off task to a member or Anyone
- Claim available one-off task
- Mark assigned task Done
- Submit Can't do with reason
- Request swap with reason

### Admin

- Manage recurring chores
- Manage reminder rules
- Manage 1/2/3-week daily rotation
- Generate next 6 weeks
- View members/devices

## Acceptance Criteria

### Dashboard

- Shows Today, This week, Available one-off tasks, Requests involving you, Done recently
- Has visible `+ Create one-off task`
- Swap requested and Can't do appear under Requests, not Done

### Week

- Shows one week at a time
- Supports Everyone / Me toggle
- Shows tasks on their exact due date
- Daily recurring tasks show Week A/B/C

### One-off tasks

- Any member can create from Dashboard
- Required: name, assignee, due date, description/checklist
- Optional: due time
- If assigned to Anyone, status is Available
- Claiming changes status to Pending and assigns to claimant
- It does not repeat

### Recurring chores

- Admin-managed only
- Generate task instances
- Task status changes do not change recurring rule

### Rotation

- Admin can select 1, 2, or 3-week cycle
- Cycle repeats across 6 weeks
- Admin can assign each day/week cell to a member
- Dropdowns are colour-coded by member

### Description/checklist

- A flexible textarea
- Rendered as a description/checklist box
- Not separately trackable subtasks in MVP

### Activity

- Records creation, claim, done, unable, swap, generation, rotation save
- Not chat

## Tests

Acceptance tests are in `tests/acceptance` and test domain behaviour, not implementation details.
