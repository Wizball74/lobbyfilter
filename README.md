# Lobby Filter for Autodarts

A browser extension that adds a filter bar above the lobby list on
[play.autodarts.io](https://play.autodarts.io/lobbies), so you can narrow it
down to the games you actually want to play instead of scrolling past the rest.

> Unofficial community project. Not built, endorsed or supported by Autodarts.

![Simple View](lobby_x01_simple_view.jpeg)
![Detailed View](lobby_x01_all_filters.jpeg)

## What it does

**Filters** by game type, in and out mode, legs, sets, starting score (several
at once), host average, country, referee and occupancy.

**Hides abandoned lobbies** — the ones where not even the host is sitting in.
Usually sessions someone walked away from; they help nobody.

**Holds still while you click.** The lobby list refreshes constantly. If you
have ever ended up in the wrong game because a row shifted at the moment you
clicked, you know the problem. While your pointer rests on a join button, the
extension freezes the list until you move away.

**Highlights player names.** Guests without an account have no avatar and no
average badge, so their chips look just like settings — which makes an
occupied lobby look empty. Names are coloured to tell them apart.

**Auto-join.** When nothing matches right now, arm it: as soon as a seat opens
up, joining is offered with a five second countdown you can cancel.

**Four languages** — English, German, Dutch, French, following your browser.

## Install

From the store (once available):

<!-- TODO: add store links -->

Manually, from this repository:

1. Download or clone the repository
2. Open `chrome://extensions` or `edge://extensions`
3. Turn on developer mode
4. Choose "Load unpacked" and select the folder
5. Reload `play.autodarts.io`

Requires Chrome or Edge 111 or newer.

## Privacy

Nothing is collected and nothing is transmitted. No tracking, no analytics, no
accounts, no ads. Your filter settings live in `chrome.storage.local` — in your
own browser profile — and go away when you remove the extension.

Details: [PRIVACY.md](PRIVACY.md)

## Contributing

Found a lobby the filter gets wrong? An issue with a screenshot of the card
helps most — detection reads the badge texts, and Autodarts introduces new ones
from time to time.

Before opening a pull request:

```
node --check content.js && node --check inject.js && node check.js
```

`check.js` catches identifiers that are used but never declared. `node --check`
only validates syntax and lets exactly that mistake through.

How it works internally: [ARCHITECTURE.md](ARCHITECTURE.md)

## Layout

```
manifest.json     Extension manifest (MV3)
inject.js         Runs in page context, taps the site's lobby data
content.js        Filter bar, card parsing, filter logic, translations
panel.css         Styling
icons/            16, 32, 48, 128 px
check.js          Lint script, not shipped
pack.sh           Builds the store zip
```

## Licence

<!-- TODO: pick a licence, e.g. MIT -->
