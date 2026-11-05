# Account Per Container — Technical audit report

## Baseline

- Repository: https://github.com/k20ali/account-per-container
- Upstream: https://github.com/tiansh/account-per-container
- Baseline commit: 6fa2a3c751ca9b1dce7b96ab193df295e8191669
- Observed upstream version: 1.1.3
- License: MPL-2.0
- Manifest V2 is retained; this change does not claim an AMO listing or approval.

## Confirmed findings and fixes

| ID | Finding | Code evidence | Fix |
|---|---|---|---|
| R1 | Rule removal mutated memory without persisting. | removeRule only spliced the array. | Persist mutations and restore in-memory state if storage writes fail. |
| R2 | Missing active tab/context and invalid URL could be dereferenced. | getPageContext accessed context without a null check; getTabInfo constructed URL directly. | Validate tabs and HTTP(S) URLs; return null/false for absent context. |
| R3 | DOM observer omitted childList changes. | MutationObserver watched subtree and attributes only. | Observe childList and debounce scans to detect SPA replacement. |
| R4 | about:blank and opaque URLs were not handled defensively. | Direct URL construction and host access. | Accept only HTTP(S) URLs with a hostname. |
| R5 | Password counter began as null. | null incremented to 1 in JavaScript, so this alone was not a functional defect. | Initialize to 0 in the revised detection logic for clarity. |
| R6 | Missing container metadata could crash the options and popup views. | Unchecked context lookups and context.name access. | Guard missing context and render a safe empty state. |
| R7 | HTTP was outside the content-script match scope. | Upstream matched HTTPS only. | Explicitly include HTTP and HTTPS host patterns. |
| R8 | Legacy applications.gecko metadata was used. | Manifest used applications.gecko. | Use browser_specific_settings.gecko and declare data collection categories. |
| R9 | Fork identity and version required separation. | Upstream ID and version 1.1.3 were copied. | Propose a distinct ID and version 1.2.0; neither AMO reservation nor release history is claimed. |
| C1 | Direct input.value assignment did not notify all controlled-input implementations reliably. | The content script assigned value directly. | Use the native setter and dispatch a bubbling input event; real-framework verification remains pending. |
| S1 | Login input replacement in SPAs could leave stale listeners. | lastLogin was not updated after detection. | Track input identity, detach obsolete listeners and rescan on structural mutations. |
| U1 | User input could be overwritten by an asynchronous autofill. | Saved username lookup could complete after input changes. | Recheck the input, value and user-edit state before filling. |

## Validation

- npm run check: PASS.
- npm test: PASS (automated mocked tests).
- npm run validate: PASS.
- Real Firefox, React, Vue, iframe, Shadow DOM and password-manager checks: NOT RUN.
- web-ext lint/build and Mozilla validation: NOT RUN.

## Release decision

READY_FOR_REVIEW_ONLY. The source changes and automated checks are reviewable; real-browser validation, a reproducible Firefox package build, and Mozilla AMO validation remain outstanding. The proposed Gecko ID has not been reserved. The fork uses Firefox Sync storage and discloses usernames and saved website hosts in the built-in data-consent metadata.
