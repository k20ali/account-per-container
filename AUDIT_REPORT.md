# Container Username Assistant — Technical audit and release preparation

## Baseline

- Target repository: https://github.com/k20ali/account-per-container
- Upstream: https://github.com/tiansh/account-per-container
- Original baseline commit: 6fa2a3c751ca9b1dce7b96ab193df295e8191669
- Observed upstream version: 1.1.3
- License: MPL-2.0
- Proposed release: 1.2.0 (not yet published)
- Proposed display name: Container Username Assistant
- Manifest V2 is retained for this maintenance release; no AMO listing or approval is claimed.

## Confirmed findings and fixes

| ID | Finding | Evidence | Resolution |
|---|---|---|---|
| R1 | Rule removal mutated memory without persisting. | removeRule only spliced the array. | Persist changes and roll back in-memory state if the storage write fails. |
| R2 | Missing active tab/context and invalid URL could be dereferenced. | getPageContext accessed context without a null check; getTabInfo constructed a URL directly. | Validate tabs and HTTP(S) URLs, returning safe null/false states. |
| R3 | DOM observer omitted child-list changes. | The observer watched subtree/attributes only. | Observe child-list mutations and coalesce rescans for SPA input replacement. |
| R4 | Opaque/non-web URLs were not handled defensively. | Direct URL construction and host access. | Accept only HTTP(S) URLs with a host. |
| R5 | Password counter began as null. | JavaScript treats null + 1 as 1, so this alone was not a functional defect. | Use a numeric zero counter in the revised detection logic. |
| R6 | Missing container metadata could crash options and popup views. | Unchecked identity lookups and property access. | Guard absent metadata and render safe states. |
| R7 | HTTP login pages were outside the original match scope. | Upstream matched HTTPS only. | Include HTTP and HTTPS host patterns. |
| R8 | Legacy Gecko manifest metadata was used. | Upstream used applications.gecko. | Use browser_specific_settings.gecko and built-in data-consent declarations. |
| R9 | Fork identity and version required separation. | Upstream ID/name/version were copied. | Propose distinct display name, Gecko ID and version 1.2.0; no AMO reservation or release history is claimed. |
| P1 | Permission for contextualIdentities needs cookies in Firefox. | Current Mozilla/MDN API documentation requires both permissions. | Retain cookies in the manifest but do not call cookie read/write APIs. |
| P2 | Previous metadata could imply Android support. | Android lacks an equivalent default container-management UI. | Remove Android compatibility metadata; target desktop Firefox only. |
| C1 | Direct input.value assignment did not reliably notify controlled inputs. | Original content script assigned value directly. | Use the native value setter and a bubbling input event; React/Vue still need recorded real-browser validation. |
| S1 | Dynamic input replacement could leave stale listeners. | lastLogin was not updated and child-list changes were not observed. | Track input identity, detach obsolete listeners and rescan on structural mutations. |
| U1 | Asynchronous username lookup could race user input. | Saved username could resolve after the field changed. | Recheck input identity, current value and user-edit state before filling. |

## Validation

- Local npm run validate: PASS on the final extension/package snapshot after manifest corrections; 15 tests, 0 failures.
- GitHub Actions: PASS on release-preparation code commit fa783fccf12246b4efcdbe360bc3374dfbd1a0f8; see https://github.com/k20ali/account-per-container/actions/runs/42065344946.
- Maintainer-reported smoke test: user reports trying the test build and observing no problems; detailed browser version/scenarios are not recorded.
- AMO upload archive: created from production extension files only, with manifest.json at the ZIP root; file list, manifest and locales verified.
- web-ext lint/build: NOT RUN here because npm registry DNS resolution failed.
- AMO validator, signing, and reviewer approval: NOT RUN.

## Release decision

Prepared for AMO validation, not yet submitted. The extension targets desktop Firefox 140+, keeps readable/unminified source, declares authenticationInfo and browsingActivity, includes a draft privacy policy and listing content, and retains the upstream MPL-2.0 license. The user reports a smoke test without observed issues; exact browser version and cases are not recorded. Name/slug availability is not reserved. A live check of the exact final package, web-ext validation, and AMO validation remain required.
