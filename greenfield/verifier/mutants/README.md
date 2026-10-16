# Stockroom mutants

Apply each patch independently to a fresh reference copy with `git apply <absolute-patch-path>`. Never stack patches.

The 18 original mutations are preserved. This exceeds the starter AGENTS target of 7–8 core plus 1–2 non-functional mutants; organizer review is required.
Earlier targeted reports prove detection, not full-suite score loss. Full-run records, when executed, are stored under `verifications/<id>/1/` with an unmutated `control`. No expected full score is fabricated.

| Patch | Defect | Original targeted checks |
|---|---|---|
| M01.patch | Apply a successful retry twice | D01, C02 |
| M02.patch | Treat object key insertion order as retry identity | D02 |
| M03.patch | Silently accept a conflicting request ID | D03 |
| M04.patch | Expire strictly after the deadline instead of at it | K01, K05 |
| M05.patch | Accept stale revisions | O04, C03, C04 |
| M06.patch | Validate each return independently of past returns | O07 |
| M07.patch | Discard physical stock when cancelling a reservation | I05 |
| M08.patch | Ship without consuming physical stock | I05, I06 |
| M09.patch | Credit the destination before transfer receipt | F01 |
| M10.patch | Restore returns to the wrong warehouse | O06 |
| M11.patch | Mutate live state before all lines validate | O01, O05, F03 |
| M12.patch | Lose retry identity on process restart | R02 |
| M13.patch | Count reserved stock as available | F02, C01 |
| M14.patch | Acknowledge in-memory commits without durability | R01, R03 |
| M15.patch | Cancel transfers into the destination warehouse | F04 |
| M16.patch | Allow the logical clock to move backwards | K02 |
| M17.patch | Omit the inventory cap | I03, O08, F07 |
| M18.patch | Cancel all ordered units at expiry, including shipped stock | K03, R06 |
