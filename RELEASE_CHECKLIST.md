# Release Checklist — Container Username Assistant 1.2.0

## Prepared in the repository

- [x] Distinctive fork name: Container Username Assistant.
- [x] Preserve upstream MPL-2.0 license and source attribution.
- [x] Keep the source readable; no minification, obfuscation, or remote code.
- [x] Review and declare data categories for stored usernames and website hosts.
- [x] Add privacy policy and AMO listing/reviewer draft.
- [x] Add reproducible Windows packaging script that places manifest.json at ZIP root.
- [x] Add dependency-free Node.js syntax and regression checks.
- [x] Keep release package free of repository tests and documentation.

## Validation

- [x] Local npm run validate passed on the preceding code revision: 15 tests, 0 failures.
- [x] GitHub Actions passed on the previous branch revision.
- [x] Maintainer-reported smoke test: user says they tested the extension and observed no problems; Firefox version and detailed scenarios are not recorded.
- [ ] Confirm a successful CI run for the final release-prep commit.
- [ ] Run web-ext lint and web-ext build in a network-enabled environment. They could not be installed in this environment because npm registry DNS resolution failed.
- [ ] Re-test the final packaged ZIP in Firefox desktop 140+.
- [ ] Record Firefox version and the scenarios actually exercised in LIVE_TEST_PLAN.md.
- [ ] Review all AMO validator warnings before submitting.

## AMO form

- [x] Draft name, summary, description, version notes and reviewer notes.
- [x] Draft privacy policy.
- [x] Choose desktop-only compatibility for this release.
- [ ] Check whether the suggested AMO slug is available.
- [ ] Add real screenshots of the extension popup/options page from Firefox.
- [ ] Add a support email if desired; none has been supplied in this task.
- [ ] Submit the package in the AMO developer hub and complete any sign-in/verification steps.
- [ ] Wait for AMO validation/review; approval cannot be guaranteed.

## Submission entry point

https://addons.mozilla.org/developers/addon/submit/

## Packaging on Windows

From the repository root in PowerShell, run:

npm run validate
npm run package:windows

The generated ZIP is in the artifacts folder. Upload the ZIP containing the extension files themselves—not the repository ZIP—to AMO.

## Current status

Prepared for AMO validation, not yet submitted. The final branch CI run, final package smoke test, web-ext checks, AMO validator, signing, and review remain outstanding.
