# Changelog

## 1.2.0 — proposed maintenance version (unreleased)

This is the first proposed maintenance version in this fork, based on the upstream repository's observed 1.1.3 baseline. It does not claim that intermediate upstream versions were released.

- Persist rule removals and clean up rules when a Firefox container is deleted.
- Validate stored rules, host names, tab context and HTTP(S) URLs before using them.
- Handle absent active tabs, stale context, missing container metadata and unknown messages safely.
- Detect dynamically inserted or replaced login inputs and detach old listeners.
- Fill controlled inputs through the native value setter and a bubbling input event; do not autofill over non-empty fields or refill after user edits in the current document.
- Support HTTP and HTTPS login pages.
- Replace the upstream Gecko ID with a distinct proposed fork ID and declare synced usernames and saved website hosts for Firefox's built-in consent UI.
- Add dependency-free Node.js tests, validation scripts and a GitHub Actions workflow.
- Document known limitations and real-browser test requirements.
