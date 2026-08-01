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
not show as a badge: country, referee flag, exact player count, `maxPlayers`
and, per player, the exact numeric average. Matched to a card by the lobby UUID
in the markup, failing that by a host name that matches exactly one known lobby.

If no API data arrives for a card, everything from source 1 still filters
correctly — including the average, which is read from the card's own `35+`
badge, not the API (see *Average*). Only the country and referee filters truly
need source 2 and become undecidable without it. Those cards stay visible,
dimmed with a yellow bar, and the status line counts them. The bar carries a
`title` tooltip (`ttNoData`) so the marker explains itself on hover — an
attribute, not a node, so the `childList` observer stays asleep.

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

## Everything selectable is a multi-select

Game type, starting score, in mode, out mode, bull mode and country all take
several values at once. Nothing selected means no restriction — there is no
separate "all" entry competing with the real values.

Three shapes, chosen by list length:

| Values | Control |
|---|---|
| 2–4, short labels | segmented row of keys (`segmented()`) |
| 5–6, short labels | checkbox row (`checkboxSet()`) |
| long or open-ended | dropdown holding checkboxes (`checkboxMenu()`) |

## Game type is a multi-select

A plain `<select>` cannot express "Bermuda or Shanghai or Cricket", and eleven
loose checkboxes would be a wall of tiles in the main bar. `checkboxMenu()` is
a dropdown holding checkboxes: the trigger stays as narrow as a select and
shows the state — `all (11)`, `Cricket (2)`, or `3 game types`.

Nothing ticked means all, same convention as the starting scores. Every variant
stays listed even when none is open; the count next to it says how many are.

Consequence for `x01Context()`: the X01-only controls grey out only when X01 is
definitely excluded. "Cricket + X01" still needs the out mode.

Country uses the same `checkboxMenu()` — the list is open-ended and grows with
whatever hosts are online.

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
badge reading `Bermuda` is a game type. The exceptions are the acronym game
types `ATC` and `RTW`, which are all-caps by nature — they are matched
explicitly *before* the capitalisation rule, or an ATC-only lobby would read as
having a player called "ATC" and never count as empty.

Two more things that are deliberately **not** players: a bare number (a stray
`1` leg/set count that reached the name step) and a CPU opponent (`BOT LEVEL 4`).
Both are skipped, so a bot-only lobby reads as empty. The bot match is by name
only and would miss a localised bot name; with API data present, bot players
(`cpuPPR` set) are dropped from the count instead, which is language-proof.

Leg and set counts are matched as "a number, then L/Leg/Legs or S/Set/Sets",
independent of language and of whether the word is abbreviated — `First to 3L`,
`3 Legs`, `2 Sets 3 Legs`, `First to 2S/2L`, `Erster zu 3L` and
`Beste van 3 sets` all work. The number must come first, which is why `MASL04`
does not qualify. The combined `2S/2L` form needs the bridge between the two
tokens to allow a slash, not only spaces and digits.

Bull-off is matched as a prefix, so an annotated `Bull-off (Official)` still
reads as bull-off rather than falling through to a player name.

Note that the API only ever *adds* to what the card said. A lobby object
without a `sets` field says nothing about sets; overwriting the parsed value
with `null` there used to wipe out a perfectly good reading.

## Average

The average filter reads the card's own `35+` badge, not the API. Autodarts
only ever shows an average as a 5-wide bucket, so the filter offers the same
5-step values (`10+` … `100+`, two `<select>`s for the range) and matches a
lobby if **any** player's bucket falls in it. `parseCard()` keeps the bucket
numbers in `avgBuckets`; `parseInt("35+")` drops the trailing `+`.

Using the badge rather than the exact API average has two payoffs: what the
card shows is exactly what filters — a `35+` lobby can no longer be hidden by a
"30–40" filter because its API object was late — and a lobby with a visible
average never falls into `nodata` on the average filter. A lobby that shows no
average badge at all (only guests, say) genuinely has no value and stays
`nodata`.

The exact per-player average does exist in the API (`players[].user.average`,
`host.average`) but is deliberately not used for filtering: relying on it once
made lobbies undecidable whenever their API object had not arrived, even though
the card plainly showed a bucket.

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

  The order of operations matters. A node disappearing usually means React is
  redrawing the same lobby, not that it closed — but finding that out takes
  time the click does not have. So:

  1. `adoptSlot()` looks for an equivalent card **synchronously** (by lobby
     UUID, falling back to text content). A full re-render removes and
     re-inserts in the same batch, so the replacement is normally already
     there — it inherits the slot and no placeholder is ever created.
  2. If nothing matches, a placeholder goes in **immediately**. Waiting even
     60 ms to be sure leaves a gap, and everything below jumps up during
     exactly the window in which the click lands.
  3. `resolveGap()` looks again after 80 ms, for a replacement that only
     arrived in a later frame, and removes the placeholder if one turns up.

  Getting this wrong is visible in two distinct ways: hold too late and rows
  shift under the cursor; hold too eagerly and the list briefly doubles.
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

It fires on the first matching lobby that still has room for a one-on-one, and
that check is independent of the "seat free" filter checkbox: joining a lobby
that already has two players helps nobody. An unknown player count reads as
"do not fire".

The five second countdown before the click is deliberate. An unattended join
leaves a real person waiting for an opponent who never throws.

## "Seat free" means at most one player

Not `players < maxPlayers`. `maxPlayers` is 6 on every lobby regardless of what
the host intends, so it says nothing about whether a game is still joinable —
an X01 lobby with two people in it is done taking players even though four
slots are nominally open.

The threshold is therefore one: room for the user to make it a one-on-one. The
player count comes off the card, so unlike a `maxPlayers` comparison this never
depends on API data and is never undecidable.

Bots do not count towards the total (see *Badge parsing*): a lobby holding only
`BOT LEVEL n` is empty as far as "seat free" and "hide empty" are concerned —
there is no real opponent in it.

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
- Bot detection from the card keys on the English name `BOT LEVEL n`. A
  localised name would slip through and count as a real player — but only when
  no API data is present; with the lobby object, `cpuPPR` catches it regardless
  of language. The robust fix is to key on the bot's icon/markup once a bot
  chip's DOM has been captured.
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
