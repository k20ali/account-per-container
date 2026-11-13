# Changelog

## 1.2.1 — proposed maintenance release (not yet published)

- Detect login dialogs that are already present in the DOM but become visible after an ancestor's class or style changes, including the tested Soft98 login dialog.
- Limit ancestor-attribute-triggered rechecks to changed elements containing likely credential fields.
- Add a regression test for login forms revealed by an ancestor class change.
- Retain the Firefox desktop 142 minimum and existing data-consent declaration.

## 1.2.0 — proposed maintenance release (not yet published)

Project display name: Container Username Assistant.

This is the first proposed maintenance version in this fork, based on the upstream repository's observed 1.1.3 baseline. It does not claim that intermediate upstream versions were released.

- Persist rule removals and restore in-memory state if a storage write fails.
- Clean up rules when a Firefox container is deleted.
- Validate stored rules, host names, tab context and HTTP(S) URLs.
- Handle absent active tabs, stale context and missing container metadata.
- Detect dynamically inserted or replaced login inputs and detach obsolete listeners.
- Fill controlled inputs using the native setter and a bubbling input event; avoid overwriting non-empty values or refilling after deliberate user edits.
- Support HTTP and HTTPS login pages.
- Use a distinct display name and Gecko ID for this fork, and declare built-in data-consent categories for usernames and saved website hosts.
- Retain the required cookies permission for Firefox's contextualIdentities API; the extension does not read cookie values.
- Add automated regression tests, validation workflow, privacy policy, AMO listing draft, release checklist and reproducible Windows packaging script.

## Compatibility

This release targets Firefox desktop 142 or later. The higher minimum avoids the AMO Android data-consent compatibility warning without declaring Android support. Firefox Android is not advertised as supported.
