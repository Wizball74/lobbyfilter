# Privacy Policy — Lobby Filter for Autodarts

_Last updated: 2026-08-01_

## Summary

This extension collects nothing, transmits nothing, and contacts no server of
its own. It has no analytics, no tracking, no accounts and no advertising.

## What the extension stores

Your filter settings — selected game type, in/out mode, legs, sets, points,
average range, country, and the checkbox states — are saved with
`chrome.storage.local`. This data stays in your browser profile on your own
device. It is never sent anywhere. Removing the extension removes it.

## What the extension reads

On `play.autodarts.io` only, the extension:

- reads the lobby cards already displayed on the page, to determine each
  lobby's settings;
- observes the site's own network responses (its lobby API calls and
  WebSocket messages) in the page context, to read lobby details that the
  cards do not display — host average, country, referee flag, player count.

This data is used solely to decide which lobby cards to show or hide, and is
discarded when the page closes. None of it is stored, logged or transmitted.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Remember your filter settings between visits. |
| `https://play.autodarts.io/*` | The extension only runs on the Autodarts lobby page. It has no access to any other site. |

## Third parties

None. No data is shared with anyone, including the developer.

## Affiliation

This is an unofficial, community-built extension. It is not made, endorsed or
supported by Autodarts.

## Contact

Questions or issues:
wizball@addy.io
