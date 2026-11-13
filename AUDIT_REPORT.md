# Container Username Assistant — Technical audit and release preparation

## Baseline

- Target repository: https://github.com/k20ali/account-per-container
- Upstream project: https://github.com/tiansh/account-per-container
- Observed upstream baseline version: 1.1.3 at the time this fork was reviewed.
- License: Mozilla Public License 2.0 (MPL-2.0); retain upstream notices.
- Current repository version: 1.2.1 (proposed maintenance release; not published as a GitHub Release).
- Target: Firefox desktop 142 or later. Firefox Android is not advertised as supported.
- Manifest V2 is retained. No AMO submission, signing, listing, or approval is claimed.

## Confirmed findings and implemented mitigations

| ID | Finding | Resolution |
|---|---|---|
| R1 | Rule removal could change memory without persisting. | Persist removal and restore in-memory state if storage writes fail. |
| R2 | Missing active-tab context and invalid URLs could cause errors. | Validate tab context and accept only supported HTTP(S) URLs with a host. |
| R3 | Dynamic login controls could be inserted or replaced after initial detection. | Observe relevant DOM mutations, rescan forms, and detach listeners from obsolete fields. |
| R4 | Non-web and opaque URLs were not handled defensively. | Ignore unsupported URLs safely. |
| R5 | The original password counter used a null initial value. | Use a numeric counter; the old expression was not by itself a functional defect because JavaScript coerces null during addition. |
| R6 | Missing container metadata could break popup/options views. | Guard missing identity metadata and render safe states. |
| R7 | HTTP login pages were outside the original matching scope. | Include both HTTP and HTTPS pages. |
| R8 | Legacy Gecko manifest metadata was used upstream. | Use browser_specific_settings.gecko and data-collection declarations. |
| R9 | Fork identity needed to differ from upstream. | Use a distinct display name and Gecko ID; no AMO name or slug reservation is claimed. |
| P1 | Firefox requires the cookies permission for contextualIdentities. | Retain the required permission; the extension does not call cookie read/write APIs. |
| P2 | Android metadata could imply unsupported compatibility. | Target desktop Firefox only and do not advertise Android support. |
| C1 | Direct input.value assignment may not update framework-controlled state. | Use the native input value setter and dispatch a bubbling input event. Real-browser React/Vue validation remains unrecorded. |
| S1 | Dynamic replacement could leave stale listeners. | Track input identity, remove obsolete listeners, and rescan after structural changes. |
| U1 | An asynchronous username lookup could race with user input. | Recheck input identity, current value, and user-edit state before filling. |
| M1 | Multi-step login pages may show an identifier field before a password field. | A proposed change exists in PR #2, but it is not merged; the branch has diverged from master and GitHub reports it is not currently mergeable. Review/rebase and automated plus live-browser tests are required before shipping it. |

## Current validation status

- Latest observed GitHub Actions run for the current master commit: PASS — https://github.com/k20ali/account-per-container/actions/runs/43515443919
- The repository checklist records a prior automated validation run with 15 tests and no failures. That historical result does not include the unmerged PR #2 changes.
- A fresh local validation could not be run during this review because the environment could not resolve github.com to clone the repository.
- web-ext lint/build: not confirmed for the current exact package.
- Final packaged ZIP test in Firefox desktop 142+: not recorded.
- AMO validator, submission, signing, and reviewer approval: not performed.

## Release decision

Version 1.2.1 is prepared in repository metadata but is not ready to be described as fully verified or published. Before release, run validation on the exact final commit, build and inspect the production ZIP, test that ZIP in Firefox desktop 142 or later, record the real-browser scenarios in LIVE_TEST_PLAN.md, and review AMO validator output.

PR #2 must be resolved separately: it is not mergeable against the current master state and should not be force-merged or deleted without reconciling its unique changes. Branch deletion and GitHub Release creation were not performed by this audit.
