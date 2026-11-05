# Live Firefox test plan

Record the exact Firefox version, operating system, and whether the test used a temporary installation or signed build. Do not mark a test passed until it is executed in real Firefox.

| ID | Scenario | Expected result | Status |
|---|---|---|---|
| F01 | Plain HTML login form | Username fills only for the same host and container. | NOT RUN |
| F02 | Real React-controlled login | Framework state and visible username agree after autofill. | NOT RUN |
| F03 | Real Vue-controlled login | Vue model and visible username agree after autofill. | NOT RUN |
| F04 | SPA inserts/replaces input | New input is detected and old listener is removed. | NOT RUN |
| F05 | Existing non-empty username | User-entered value is not overwritten. | NOT RUN |
| F06 | User clears and edits field | Extension does not refill after deliberate edit in the same document. | NOT RUN |
| F07 | about:blank and unavailable URL | No wrong host is attributed and no uncaught error occurs. | NOT RUN |
| F08 | Delete a Firefox container | Its rules are removed and options remain usable. | NOT RUN |
| F09 | Firefox password manager | Password fields and saved-login interaction remain functional. | NOT RUN |
| F10 | HTTP and HTTPS | Both protocols are detected with host/port scoping preserved. | NOT RUN |
| F11 | iframe | No false claim of iframe support or parent-host attribution. | NOT RUN |
| F12 | Open Shadow DOM | No false claim that the form is detected. | NOT RUN |
| F13 | Remove rule and restart | Deleted rule remains deleted after restart. | NOT RUN |
| F14 | Consent and sync | Installation disclosure and Firefox Sync behavior are understood. | NOT RUN |

Automated checks: run npm run validate from the repository root. These checks do not replace F01–F14 or Mozilla's validator.
