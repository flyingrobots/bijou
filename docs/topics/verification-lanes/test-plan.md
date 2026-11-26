# Test plan: verification lane classifier

This ledger lists each requirement of the
[verification lane classifier](./README.md), the test that holds it, and its
status. Every test is in `scripts/`, in the file named in the group heading.
The oracle for each case is the assertion in the named test. A name with `%s`
or `%j` is one parameterized test.

## Golden table: `verification-lane.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| VL-01 | Each representative path gets its expected lane, reason and deciding pattern, including `docs/CHANGELOG.md` (fast) and an unknown path (full). | `%s -> %s (%s)` | Implemented |
| VL-02 | The golden table covers every reason id. | `covers every reason id in the rule tables` | Implemented |
| VL-03 | A mixed diff escalates to full when any path is full. | `escalates a mixed diff to full when any path is full` | Implemented |
| VL-04 | A docs and test only diff is fast. | `keeps a docs and test only diff fast` | Implemented |
| VL-05 | `dogfood` follows the shell DOGFOOD patterns, independent of the lane. | `sets the dogfood flag from the shell DOGFOOD patterns, not from the lane` | Implemented |
| VL-06 | `requiredPolicy` maps fast and full to the versioned policy identities. | `maps each lane to its versioned policy identity` | Implemented |

## Fail closed: `verification-lane-fail-closed.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| VL-10 | An empty change set is full, reason `unknown`, with `dogfood`. | `classifies an empty change set full with reason unknown and dogfood on` | Implemented |
| VL-11 | A path outside every pattern is full, reason `unknown`. | `classifies a path outside every listed pattern full with reason unknown` | Implemented |
| VL-12 | Deletion, rename, copy, type change, unmerged and unrecognized statuses escalate a fast path to full. | `escalates a fast-rule path with status %s to full (%s), keeping the rule that matched` | Implemented |
| VL-13 | Additions and modifications of fast paths stay fast. | `keeps an addition or modification of a fast path fast` | Implemented |
| VL-14 | A rename contributes both paths and escalates. | `classifies both sides of a rename and escalates the diff` | Implemented |
| VL-15 | A deleted test file is full. | `escalates a deleted test file even though tests are fast` | Implemented |
| VL-16 | An invalid path is full and sets `dogfood`. | `classifies the invalid path %j full and sets dogfood` | Implemented |
| VL-17 | Case and dot-segment near misses do not match fast patterns. | `does not stretch a fast pattern to the near miss %s` | Implemented |
| VL-18 | A full rule wins over a fast rule for the same path. | `never lets a fast rule win over a full rule for the same path` | Implemented |
| VL-19 | An unparseable diff or path list throws instead of returning a lane. | `refuses an unparseable diff instead of returning a lane` | Implemented |
| VL-20 | A path list mixes bare paths and name-status lines. | `reads a path list of bare paths and name-status lines` | Implemented |

## Properties and allow-list: `verification-lane-property.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| VL-30 | Adding any path to a full change set never makes it fast (3,000 seeded cases). | `never turns a full change set fast by adding any path` | Implemented |
| VL-31 | A set's lane is the heaviest of its paths, in any order. | `decides a set as the heaviest of its paths, in any order` | Implemented |
| VL-32 | Every fast pattern has a justification entry. | `has a justification entry for every fast pattern` | Implemented |
| VL-33 | No justification names a pattern outside the fast allow-list. | `justifies no pattern that is not in the fast allow-list` | Implemented |
| VL-34 | Every full rule precedes the first fast rule. | `lists every full rule before the first fast rule` | Implemented |

## Parity and the real tree: `verification-lane-parity.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| VL-40 | `isDogfoodRelevant` agrees with the shell functions in `scripts/hooks/pre-push` and `.github/workflows/ci.yml` for every tracked path and edge paths. | `matches %s (%s) for every tracked path and for edge paths` | Implemented |
| VL-41 | Every tracked file classifies by a listed pattern or as `unknown`, and both lanes are populated. | `classifies every tracked file, each by a listed pattern or as unknown` | Implemented |

## Command: `verification-lane-cli.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| VL-50 | The default diff is from the merge base with `origin/main` to `HEAD`. | `classifies a docs and test commit fast against the merge base with origin/main` | Implemented |
| VL-51 | The real git diff reports renames and deletions, which escalate. | `escalates a rename and a deletion found by the real git diff` | Implemented |
| VL-52 | `HEAD` equal to its base is an empty change set, full. | `classifies HEAD equal to its base as an empty change set, full` | Implemented |
| VL-53 | A diff that cannot be computed exits 1 with a full error line and writes `lane=full` to `$GITHUB_OUTPUT`. | `exits non-zero with a schema-valid full error line when the diff cannot be computed` | Implemented |
| VL-54 | Bad arguments are schema'd errors. | `rejects bad arguments %j` | Implemented |
| VL-55 | `--paths-from`, `$GITHUB_OUTPUT` and `--human` prose. | `reads --paths-from, writes $GITHUB_OUTPUT and prints prose with --human` | Implemented |
| VL-56 | An unreadable path list is an error, never a lane. | `reports an unreadable path list as an error, never a lane` | Implemented |
| VL-57 | `--help` and `--schema` emit schema-valid lines. | `describes itself with --help and --schema as schema-valid lines` | Implemented |

Every JSON line in VL-50 to VL-57 is validated against
`schemas/bijou.verify-lane.event.v1.schema.json` with Ajv in strict mode.
