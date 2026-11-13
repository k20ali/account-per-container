# AMO Listing and Submission Draft

This document is a copy-ready draft for the Firefox Add-ons (AMO) submission form. No AMO submission or listing has been created by this repository change.

## Listing fields

**Name:** Container Username Assistant

**Suggested URL slug:** container-username-assistant  
AMO confirms URL-slug availability in its submission form; this slug is not reserved.

**Version:** 1.2.1 (proposed maintenance release; not yet published)

**Summary:**
Save a username for each website and Firefox container, then fill it on later visits. Review or delete saved rules at any time.

**Description:**

Container Username Assistant helps keep login usernames separate between Firefox containers. Save a username for a website in one container, and the extension can fill it on later visits to the same host in that container.

**How to use**
1. Open an HTTP or HTTPS login page in a Firefox desktop container.
2. Enter the username normally.
3. Click the extension icon in the address bar and choose Add Rule or Update Rule to confirm saving it.
4. Visit the same host in the same container later.
5. Open the options page whenever you want to review or remove a saved rule.

The extension stores usernames, not passwords. It requests access to HTTP and HTTPS pages to find username fields, plus the Firefox container and storage APIs needed to match a saved rule to a container. Firefox requires the cookies permission to use its contextual-identities API; the extension itself does not read or write cookie values.

Rules are stored with Firefox browser.storage.sync. If Add-ons synchronization is enabled in Firefox desktop Sync settings, saved rules may be synchronized through the user's Mozilla account. The maintainer does not operate a server for rule data and the extension contains no ads, analytics, tracking beacons, or remotely loaded code. See the privacy policy for the data handled and synchronization details.

This is an independently maintained fork of https://github.com/tiansh/account-per-container, with changes to rule persistence, URL and tab-context validation, dynamic login-field detection, and repository tests. It is not affiliated with the original author. The distinctive name is intentional: Mozilla's fork policy expects the name to clearly distinguish the fork and the code/functionality to differ significantly.

**Categories:** Choose Privacy & Security as the primary category if it is offered. Select a second category only if the current AMO form offers a clearly relevant choice.

**Platforms:** Firefox desktop only for this release. Do not advertise Firefox Android support.

**Payment:** Free; no paid service or additional hardware is required.

**License:** Mozilla Public License 2.0 (MPL-2.0).

**Support website:** https://github.com/k20ali/account-per-container

**Support email:** Not supplied. Use an email address you control if you want one shown in the listing; do not invent an address.

**Privacy policy:** Use the public privacy policy at https://github.com/k20ali/account-per-container/blob/master/PRIVACY_POLICY.md.

**Experimental listing flag:** Leave unchecked only if you consider the add-on ready for general use after reviewing the release checklist and AMO validator results.

## Release notes for 1.2.1

This maintenance release consolidates the reliability fixes and regression coverage identified so far.

- Fix rule-removal persistence and restore in-memory state if a storage write fails.
- Handle missing active tabs, stale tab context, deleted containers, missing container metadata, malformed saved rules, and unsupported URLs safely.
- Detect login fields that are inserted or replaced dynamically, and detach listeners from obsolete fields.
- Re-check login forms when relevant field attributes change or a previously hidden login dialog is revealed by changes to an ancestor's class, style, or visibility attributes.
- Limit ancestor-attribute-triggered checks to changed elements containing likely credential fields.
- Fill controlled username inputs using the native setter and a bubbling input event.
- Avoid overwriting non-empty username fields and avoid refilling after deliberate user edits.
- Support both HTTP and HTTPS login pages.
- Add automated regression tests for the identified dynamic-field and login-dialog behaviors.
- Retain the Firefox desktop 142 minimum and existing data-consent declaration.

## Reviewer notes

This is an unminified, readable WebExtension; there is no bundling or transpilation step. Source and test instructions are in the public repository's master branch.

To test: install the package in Firefox desktop 142 or newer; ensure container tabs are available; open an HTTP/HTTPS page with a plain login form inside a container; type a username; use the extension icon to save a rule; reload the page and verify the username is filled; verify a non-empty username is not overwritten; remove the rule in the options page and verify it stays removed. No test credentials are needed.

The maintainer has manually tested the dynamic login-dialog behavior. The exact Firefox build and full per-scenario manual-test matrix have not been recorded in the repository, so reviewers should still perform the steps above.
