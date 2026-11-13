# Changelog

## 1.2.1 — proposed maintenance release (not yet published)

This release consolidates the reliability fixes and regression coverage identified so far.

- Fix rule-removal persistence and restore in-memory state if a storage write fails.
- Handle missing active tabs, stale tab context, deleted containers, missing container metadata, malformed saved rules, and unsupported URLs safely.
- Detect login fields that are inserted or replaced dynamically, and detach listeners from obsolete fields.
- Re-check login forms when relevant field attributes change or a previously hidden login dialog is revealed by changes to an ancestor's class, style, or visibility attributes.
- Limit ancestor-attribute-triggered checks to changed elements containing likely credential fields.
- Fill controlled username inputs using the native setter and a bubbling input event.
- Avoid overwriting non-empty username fields and avoid refilling after deliberate user edits.
- Support both HTTP and HTTPS login pages.
- Add automated regression tests for the identified dynamic-field and login-dialog behaviors.
- Keep the extension version metadata and release documentation aligned at 1.2.1.
- Retain the Firefox desktop 142 minimum and existing data-consent declaration.

## 1.2.0 — proposed maintenance release (not yet published)

Project display name: Container Username Assistant.

This was the first proposed maintenance version in this fork, based on the upstream repository's observed 1.1.3 baseline. It does not claim that intermediate upstream versions were released.

- Use a distinct display name and Gecko ID for this fork, and declare built-in data-consent categories for usernames and saved website hosts.
- Retain the required cookies permission for Firefox's contextualIdentities API; the extension does not read cookie values.
- Add automated regression tests, a validation workflow, privacy policy, AMO listing draft, release checklist and reproducible Windows packaging script.

## Compatibility

This release targets Firefox desktop 142 or later. The higher minimum avoids the AMO Android data-consent compatibility warning without declaring Android support. Firefox Android is not advertised as supported.
