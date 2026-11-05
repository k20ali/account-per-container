# Known limitations

- Real browser verification is still required. The automated suite uses mocked Firefox APIs and a simulated DOM.
- The maintainer reports trying the test build and observing no issue; the exact Firefox version and individual scenarios were not recorded in the repository.
- React and Vue: filling uses the native HTMLInputElement value setter and dispatches a bubbling input event. Supported framework versions have not been validated independently in a recorded real-browser test matrix.
- DOM scope: the detector searches regular document forms. Inputs in iframes are not targeted because all_frames is disabled; no iframe host-attribution support is claimed.
- Shadow DOM: document-level form scanning does not discover forms inside open or closed shadow roots. Shadow DOM support is not claimed.
- SPA behavior: inserted/replaced controls are rescanned, but highly customized login flows should be tested with the live plan.
- Password manager: the upstream workaround that temporarily replaces and reinserts password input nodes is retained. Test it against Firefox's password manager on representative sites.
- Rule migration: the fork uses a different Gecko add-on ID, so rules in the upstream extension's storage namespace are not automatically imported.
- Sync behavior: browser.storage.sync may synchronize rules on Firefox desktop if Add-ons Sync is enabled. Container IDs may differ between profiles, so equivalent cross-profile behavior is not guaranteed.
- Android: this release does not advertise Firefox Android support because there is no equivalent default container-management UI there.
- AMO status: no submission, reservation, signature, listing, or approval has been performed. Mozilla's validator and review are still required.
