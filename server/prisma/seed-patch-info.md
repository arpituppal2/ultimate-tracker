# Seed Patch Notes

This file is temporary documentation for the patch applied to seed.js.

## Bugs Fixed

### Bug 1: `finalizeTasks` was never defined
`assembleAllTasks()` called `finalizeTasks([...])` but the function was deleted
during the duplicate-block removal. Added definition just before `assembleAllTasks`.

### Bug 2: `weekNum` not propagated through `baseTask` / `weekTask`
`validateTaskShape` requires `task.weekNum` to be a valid integer, but `baseTask`
did not accept or return it, so every task had `weekNum: undefined` → NaN error.
Fixed by threading `weekNum` through `baseTask` and `weekTask`/`weekdayTask`.

### Bug 3: `CATEGORY.DAILY` undefined
Several task builders referenced `CATEGORY.DAILY` which was never defined.
Added `DAILY: 'daily'` to the CATEGORY constant.

## Files Modified
- server/prisma/seed.js
