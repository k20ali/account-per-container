# Container Username Assistant

A maintained, independent fork of https://github.com/tiansh/account-per-container. It remembers a username for a website in a Firefox desktop container and fills it on later visits. The proposed display name is intentionally distinct from the upstream add-on.

## Use

1. Open a login page in a Firefox desktop container.
2. Type the username you want to remember.
3. Click the extension's address-bar icon and choose Add Rule or Update Rule.
4. Open the same host in the same container later to have the username filled.
5. Open the extension's options page to review or remove rules.

Rules are scoped to a website host and a Firefox container. HTTP and HTTPS pages are supported; non-web and opaque URLs are ignored. A rule is stored only after the user confirms it in the popup.

## Privacy and permissions

The extension processes the username value that the user chooses to remember, the website host, and the container identifier. It stores confirmed rules with Firefox browser.storage.sync; if Add-ons synchronization is enabled in Firefox desktop Sync settings, rules may sync through the user's Mozilla account. Container identifiers can differ between profiles, so cross-profile autofill is not guaranteed solely because rules synchronize.

The extension does not store password field values, read cookie values, operate a backend server, or include ads, analytics, tracking beacons, or remote code. The cookies permission is included because Firefox requires it for the contextualIdentities API; the extension itself does not call cookie-reading or cookie-writing APIs.

See PRIVACY_POLICY.md for details.

## Install locally

Open about:debugging#/runtime/this-firefox in Firefox desktop 140 or newer, choose Load Temporary Add-on, and select extension/manifest.json. A temporary installation is removed when Firefox restarts.

This release targets Firefox desktop only. Android is not advertised as supported because its container user interface differs from desktop Firefox.

## Development and validation

Requires Node.js 22 or later. No third-party npm dependencies are used for automated checks. Run npm run validate from the repository root.

Automated checks validate manifest and locale JSON, JavaScript syntax, selected manifest invariants, and background/content behavior using mocked Firefox APIs and a simulated DOM. They do not replace live-browser tests of React/Vue-controlled forms or password-manager interactions. See LIVE_TEST_PLAN.md.

For publication preparation see AMO_SUBMISSION.md and RELEASE_CHECKLIST.md.

## Attribution and license

This project is a fork of tiansh/account-per-container and retains the upstream Mozilla Public License 2.0 license. Keep the existing LICENSE file and original notices when redistributing. Material changes are listed in CHANGELOG.md.
