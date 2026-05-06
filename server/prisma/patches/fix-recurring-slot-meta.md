# RECURRING_SLOT_META Bug Fix

## Problem

`RECURRING_SLOT_META` used JavaScript `||` on `CATEGORY.*` constants to express
"either/or" semantics. This does not work — `||` returns the **first truthy value**.
More critically, `CATEGORY.CAREER` and `CATEGORY.DAILY` do not exist in the `CATEGORY`
object, so slots 6 and 8 evaluated to `category: undefined`, failing `assertTaskShape`
with "missing category".

Broken lines:
```js
{ category: CATEGORY.CAREER || CATEGORY.DAILY, ... }  // slot 6 → undefined
{ category: CATEGORY.CAREER || CATEGORY.DAILY, ... }  // slot 8 → undefined
```

Also: the loop used `weekNum <= 231` instead of `weekNum <= MAX_WEEK` (247),
leaving weeks 232–247 without recurring tasks.

## Fix

Replace `RECURRING_SLOT_META` with the corrected version below, and update the
loop bound to `MAX_WEEK`.

```js
const RECURRING_SLOT_META = [
  // slot 0 — competition_math
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.RECURRING, requiresProof: false },
  // slot 1 — curriculum_mastery
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.KHAN, requiresProof: false },
  // slot 2 — ap_advanced_study
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.LESSON, requiresProof: false },
  // slot 3 — language_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.LANGUAGE_PRACTICE, requiresProof: false },
  // slot 4 — reading_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
  // slot 5 — writing_training
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.WRITING, requiresProof: false },
  // slot 6 — stem_build
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.PROJECT, requiresProof: false },
  // slot 7 — health_reflection
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
  // slot 8 — cold_email
  { category: CATEGORY.RECURRING, templateType: TEMPLATE.ACTIVITY_LOG, requiresProof: false },
];
```

And the loop bound in the OLD `generateDailyRecurringTasks` (the first one, which
is overridden by Part 2 anyway):
```js
// change:
for (let weekNum = 1; weekNum <= 231; weekNum += 1) {
// to:
for (let weekNum = 1; weekNum <= MAX_WEEK; weekNum += 1) {
```
