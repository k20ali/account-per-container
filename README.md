# Container Username Assistant

A maintained fork of [tiansh/account-per-container](https://github.com/tiansh/account-per-container). Container Username Assistant remembers a username for a website in a Firefox container and fills it on later visits. The proposed display name is distinct from upstream; it is not an AMO approval or reservation.

## Use

1. Open a login page in a Firefox container.
2. Type the username you want to remember.
3. Click the extension's address-bar icon and choose Add Rule.
4. Open the same host in the same container later to have the username filled.
5. Open the extension's options page to review or remove saved rules.

Rules are scoped to a host and a Firefox container. HTTP and HTTPS pages are supported; non-web and opaque URLs are ignored. A rule is saved only after the user confirms it in the popup.

## Privacy and permissions

The extension needs access to HTTP and HTTPS pages to identify login fields, plus the contextual-identities and storage APIs to map a username to a Firefox container and save the rule. It no longer requests the cookies API permission and does not send data to a service operated by this project.

Rule data includes the website host, Firefox container ID, and username chosen by the user. Rules are stored with browser.storage.sync, which can synchronize them through Firefox Sync when the user's Firefox Sync settings enable add-on synchronization. Since a username is authentication information and saved website hosts identify browsing activity, the manifest declares authenticationInfo and browsingActivity for Firefox's built-in data-consent prompt. The minimum supported versions are Firefox Desktop 140 and Firefox Android 142.

This fork uses a distinct proposed Gecko add-on ID. Rules in the upstream extension's storage namespace are not automatically migrated. The ID has not been reserved with Mozilla and the add-on has not been submitted to AMO.

## Install locally

Open about:debugging#/runtime/this-firefox in Firefox, choose Load Temporary Add-on, and select extension/manifest.json. A temporary installation is removed when Firefox restarts.

## Development

Requires Node.js 20 or later. No third-party npm dependencies are used for automated checks. Run npm run validate from the repository root.

The checks validate manifest and locale JSON, JavaScript syntax, selected manifest invariants, and background/content behavior using mocked Firefox APIs and a simulated DOM. They do not replace real-Firefox tests of React/Vue-controlled inputs, password-manager behavior, or Mozilla's validator. See LIVE_TEST_PLAN.md.

## Attribution and license

This project is a fork of tiansh/account-per-container and retains the upstream Mozilla Public License 2.0 license. Keep the existing LICENSE file and original notices when redistributing. Material changes are listed in CHANGELOG.md.
