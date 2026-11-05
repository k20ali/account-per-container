# Known limitations

- Real browser verification is still required. The automated suite uses mocked Firefox APIs and a simulated DOM.
- React and Vue: filling uses the native HTMLInputElement value setter and dispatches a bubbling input event. Supported framework versions have not been validated in real Firefox.
- DOM scope: the detector searches regular document forms. Inputs in iframes are not targeted because all_frames is disabled; no iframe host-attribution support is claimed.
- Shadow DOM: document-level form scanning does not discover forms inside open or closed shadow roots. Shadow DOM support is not claimed.
- SPA behavior: inserted/replaced controls are rescanned, but highly customized login flows should be tested with the live plan.
- Password manager: the upstream workaround that temporarily replaces and reinserts password input nodes is retained. Test it against Firefox's password manager on representative sites.
- Rule migration: the fork uses a different Gecko ID, so rules in the upstream extension's storage namespace are not automatically imported.
- Browser support: the manifest targets Firefox Desktop 140+ and Android 142+ to use built-in data-consent support. Compatibility with older Firefox versions is not claimed.
- AMO status: no AMO submission, ID reservation, listing, signature or approval has been performed. Mozilla's validator and review are still required.
