# Invalid environment run — not correctness or model evidence

This initial trusted-local adapter check ran on Windows before the adapter's case-insensitive environment fix. It discarded the uppercase `SYSTEMROOT` key; the unchanged reference could not bind loopback and all startup checks failed. Both captured numeric zeros are **invalid environment results**, not Stockroom reference failures or model scores.

The self-check stopped on the failed reference gate. No starter or mutant measurements were produced by this attempt, and no model was run. Original logs/reports are retained; subsequent validation uses a new directory. A regression now preserves Windows environment names case-insensitively, and an independent runtime networking preflight prevents this host failure from becoming a numeric candidate score.
