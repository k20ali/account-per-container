# Privacy Policy — Container Username Assistant

**Effective date:** November 5, 2026

Container Username Assistant is an independent Firefox add-on fork of https://github.com/tiansh/account-per-container. This policy describes the data it handles.

## Data the extension processes

When enabled on an HTTP or HTTPS page, the extension examines form controls to identify a likely username input before a password input. The current value of that username field is passed between the page content script and the extension's own background/popup code so the user can review and save a rule.

A rule is saved only after the user confirms Add Rule or Update Rule. A saved rule contains:
- the username the user chose to remember;
- the website host (including a non-default port, if present); and
- the Firefox container identifier for the rule.

The extension does not read, save, or transmit password field values. It does not read cookie values. The cookies permission is included because Firefox requires that permission for the contextualIdentities API used to identify containers; this add-on does not call cookie-reading or cookie-writing APIs.

## Storage and synchronization

Rules are stored using Firefox's browser.storage.sync extension storage. On Firefox desktop, if Add-ons synchronization is enabled in the user's Firefox Sync settings, rules may be synchronized through the user's Mozilla account to other Firefox desktop profiles.

Firefox Sync is a Mozilla service, not a server operated by this extension's maintainer. Mozilla states that synced data is encrypted on the device before it leaves the device; see the Mozilla Accounts Privacy Notice at https://www.mozilla.org/en-US/privacy/mozilla-accounts/ and Firefox Sync security explanation at https://support.mozilla.org/en-US/kb/how-firefox-sync-keeps-your-data-safe-even-if-tls-fails.

Container identifiers can differ between profiles, so this extension does not guarantee that a rule will work across profiles merely because it has synchronized. Firefox for Android is not a supported target for this release.

## Sharing and analytics

The extension's maintainer does not operate a backend service for this add-on and does not receive rule data. The add-on contains no advertising, analytics, tracking beacons, or remote code loading. Data is used only to apply the saved username rule to the matching host and container.

## Retention and user controls

Rules remain in extension storage until the user removes them in the options page or otherwise clears extension storage. Users can remove a single rule from the options page. When Firefox Sync is enabled, synchronization and deletion across profiles follow Firefox's own sync behavior and may not occur instantly.

The extension does not need an account or registration with its maintainer.

## Contact

For project information and support, use the public project repository: https://github.com/k20ali/account-per-container. A dedicated support email has not been configured in this policy.
