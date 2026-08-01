# Architecture

How the extension works internally, and where it can break. For the user-facing
view see [README.md](README.md).

## Two scripts

| File | Role |
|---|---|
| `inject.js` | Runs in the page's own JavaScript context (`"world": "MAIN"`). Wraps `fetch` and `WebSocket`, recognises lobby objects by their shape, forwards them via `postMessage`. |
| `content.js` | Runs isolated. Reads the cards, filters, enriches with the forwarded data, builds the bar. |
| `panel.css` | Styling for the bar and the card markers. |

A normal content script cannot see the page's `window.WebSocket`, which is why
the tap needs `"world": "MAIN"`. `inject.js` uses a `Proxy` rather than a
wrapper function so that constants like `WebSocket.OPEN` and the site's own
`instanceof` checks keep working.

## Two data sources

**1. The card text itself.** Every lobby card spells its settings out in
plain badges: `501`, `SI-DO`, `First to 3L`, `Bull-off`, `Cricket`.
`parseCard()` reads game type, starting score, in/out mode, legs, sets and
bull-off from these. This source is always complete — it is whatever the user
can see.

**2. The lobby objects from the site's API.** These carry what the cards do
not show: host average, country, referee flag, exact player count,
`maxPlayers`. Matched to a card by the lobby UUID in the markup, failing that
by a host name that matches exactly one known lobby.

If no API data arrives for a card, everything from source 1 still filters
correctly. Only filters that need source 2 become undecidable — those cards
stay visible, dimmed with a yellow bar, and the status line counts them.

## Three verdicts, not two

`decide()` returns `yes`, `no` or `nodata`. The third case matters: a missing
value is not always missing knowledge.

| Situation | Result |
|---|---|
| Value present, does not match | hide |
| Value absent, **game type known** | hide — the field does not exist for this variant |
| Value absent, **game type unknown** | show, mark as `nodata` |

Cricket has no starting score. That is not a data gap, it is a non-match.
Conflating the two used to let Cricket lobbies survive an X01 filter.

Related: when a non-X01 game type is selected, the points/in/out/bull controls
grey out **and stop filtering**. Greying out a control while it still
filters produces results nobody can explain.

## Badge parsing

Detection matches **words**, not whole badge texts. Autodarts combines settings
into one badge (`Cricket No Score`) and sometimes replaces the variant name
with the mode (`Tactics`). Exact matching missed both.

Anything that is not a known setting word is treated as a player name and gets
`.adlf-player`. This drives both the green highlight and the "hide empty"
filter, so display and filtering cannot disagree — if the parser is wrong, you
see it on the card rather than deducing it from the result.

Names are distinguished from settings by capitalisation: card names are
upper-case throughout, settings are not. A guest called `BERMUDA` is a name; a
badge reading `Bermuda` is a game type.

Leg and set counts are matched language-independently as "any text, a number,
then L or S at the end" — `First to 3L`, `Erster zu 3L`, `Eerst naar 2L` all
work, while `MASL04` does not qualify because it does not end in L or S.

## Freezing the list

The list reorders itself while you aim at a join button. The fix is to hold the
positions still while the pointer is on one.

Triggering does **not** use `mouseover`/`mouseout`: those fire whenever the DOM
changes under a stationary pointer, which the extension itself causes when it
thaws — the two feed each other into a flicker. Instead the actual pointer
position is polled with `elementFromPoint`, on movement and every 500 ms.
Thawing is debounced by 150 ms on top.

Only cards that are visible at the moment of freezing get pinned. A card
already filtered out stays out — pinning it would make the "hold instead of
remove" rule below bring it straight back.

While frozen:

- Cards that were visible and then get rejected by a filter are **not**
  removed, only faded to 30 % and made unclickable. Removing them would pull
  everything below upwards.
- Lobbies the site removes leave a ghost: a clone at the same position, greyed,
  with all links and buttons defused. A misclick does nothing, which beats
  landing in a stranger's lobby.

  A removal is not decided on the spot. React replaces whole card nodes on
  hover, so a node disappearing usually means the same lobby is about to be
  drawn again, not that it closed. `resolveGap()` waits 60 ms and looks for an
  equivalent card by lobby UUID, falling back to text content. If one is back,
  it inherits the pinned slot; only if none is does a ghost take the place.
  Without this, every hover duplicated the whole list.
- New lobbies are appended at the bottom with a green bar rather than pushing
  into the order.

While frozen the status line says so rather than showing a count that has
quietly stopped updating, and counts how many lobbies are waiting to slot in.
The list itself gets a thin green frame — at the moment of the click the eye is
on the cards, not on the status line.

Three thaw paths: pointer leaves, 400 ms after a click, and a 20 second
failsafe in case the leave event never arrives.

## Auto-join

Only armable while **no** lobby matches the filters — arming it when something
already matches would make no sense.

It fires on the first matching lobby that also has a genuinely free seat, and
that check is independent of the "seat free" filter checkbox: joining a full
lobby helps nobody. Where the exact player count is unavailable, a card with no
player chips is reliably empty and counts as free; anything else counts as
unknown, and unknown means do not fire.

The five second countdown before the click is deliberate. An unattended join
leaves a real person waiting for an opponent who never throws.

## Ordering without moving nodes

Sorting sets the CSS `order` property instead of reparenting nodes. Moving DOM
nodes that React owns leads to it reconciling them back, or worse. `setStyle()`
only writes when a value actually changes — every write wakes the
MutationObserver and would otherwise trigger the next pass.

The observer watches `childList` only, deliberately: `style` and `class`
changes almost always come from the extension itself.

## Translations

The `STRINGS` table sits at the top of `content.js`, not in the usual
`_locales/` tree. That keeps the extension a flat folder of four files, which
matters when it is maintained by copying files around. The cost is that the
extension name and description in the browser's extension list are
English-only.

Adding a language: copy the `en` block, rename to the language code, translate
the values. Placeholders are `$1`, `$2`.

Game names (X01, Cricket, Shanghai) and mode abbreviations (SO/DO/MO,
SI/DI/MI) are deliberately not translated — Autodarts shows them the same way
in every language, and translating them would break the match against the
card badges.

## Known fragilities

- Card detection keys on the Chakra class `chakra-card`. If Autodarts changes
  the markup, the largest-sibling-group heuristic in `findCards()` usually
  still finds the list — but this is what breaks first.
- A genuinely new mode name that replaces the variant name would be unknown.
  The card then stays marked as `nodata` rather than being misfiled.
- `parseCard()` expects the badge spelling `SI-DO`. A different format would
  defeat mode detection.
- `joinControl()` guesses which element joins a lobby: a link to `/lobbies/…`,
  otherwise the first button inside a card. Unverified — hence the countdown
  before auto-join fires.
- Deletions arriving over WebSocket are ignored. Harmless: the DOM decides
  which lobbies exist, the collected objects are only a lookup table.
- Filter state lives in `chrome.storage.local`, so it is per browser, not per
  account.

## Before shipping

```
node --check content.js && node --check inject.js && node check.js
./pack.sh
```

`node --check` only finds syntax errors. `check.js` finds identifiers that are
used but never declared — the failure mode when a constant gets deleted along
with a block during a refactor. It has shipped a broken build once already.
