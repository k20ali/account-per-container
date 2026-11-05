# Live Firefox test plan

Record the exact Firefox version, operating system, and whether the test used a temporary installation or signed build. Do not mark a case as passed unless that specific case was executed.

**Maintainer-reported smoke test:** the maintainer reports trying the test build and seeing no problem. The Firefox version and per-scenario details have not been recorded, so this does not automatically mark all cases below as passed.

| ID | Scenario | Expected result | Status in this repository |
|---|---|---|---|
| F01 | Plain HTML login form | Username fills only for the same host and container. | NOT RECORDED |
| F02 | Real React-controlled login | Framework state and visible username agree after autofill. | NOT RECORDED |
| F03 | Real Vue-controlled login | Vue model and visible username agree after autofill. | NOT RECORDED |
| F04 | SPA inserts/replaces input | New input is detected and old listener is removed. | NOT RECORDED |
| F05 | Existing non-empty username | User-entered value is not overwritten. | NOT RECORDED |
| F06 | User clears and edits field | Extension does not refill after deliberate edit in the same document. | NOT RECORDED |
| F07 | about:blank and unavailable URL | No wrong host is attributed and no uncaught error occurs. | NOT RECORDED |
| F08 | Delete a Firefox container | Its rules are removed and options remain usable. | NOT RECORDED |
| F09 | Firefox password manager | Password fields and saved-login interaction remain functional. | NOT RECORDED |
| F10 | HTTP and HTTPS | Both protocols are detected with host/port scoping preserved. | NOT RECORDED |
| F11 | iframe | No false claim of iframe support or parent-host attribution. | NOT RECORDED |
| F12 | Open Shadow DOM | No false claim that the form is detected. | NOT RECORDED |
| F13 | Remove rule and restart | Deleted rule remains deleted after restart. | NOT RECORDED |
| F14 | Data consent and sync | Installation disclosure and Firefox Sync behavior are understood. | NOT RECORDED |

Automated checks: run npm run validate from the repository root. On Windows, run npm run package:windows to build an upload ZIP whose root contains manifest.json. If web-ext is available, also run web-ext lint --source-dir extension and web-ext build --source-dir extension --artifacts-dir artifacts.
