# Handoff

Context for continuing work on this extension in Claude Code. Written at the
point where v1.0.0 was being submitted to the Edge and Chrome stores.

Read `ARCHITECTURE.md` first — it covers how the thing works. This file covers
what is not in the code: what was tried, what broke, and what to watch.

## Where things stand

Version 1.0.0 is complete and tested manually in Edge. Submission to the
Microsoft Edge Add-ons store was in progress; nothing has been published yet.
Chrome Web Store submission was planned after Edge.

Outstanding before publishing:

- [ ] Replace `<YOUR EMAIL OR GITHUB ISSUES URL>` in `PRIVACY.md`, set the date
- [ ] Publish `PRIVACY.md` somewhere with a URL (a GitHub link to the file is
      accepted)
- [ ] Screenshots, 1280×800 — bar collapsed, bar expanded, filtered result
- [ ] Store icon: Chrome wants 128×128, Edge 300×300, uploaded in the form,
      not in the zip
- [ ] `README.md` has three `<!-- TODO -->` markers: screenshot, store links,
      licence (MIT was suggested, not decided)

## How to work on it

```
node --check content.js && node --check inject.js && node check.js
./pack.sh          # builds lobby-filter-for-autodarts-<version>.zip
```

`check.js` exists because `node --check` only validates syntax. A refactor once
deleted `const BASE_SCORES` along with a neighbouring block; the result was
syntactically perfect and crashed on load. That build reached the user. Run
both.

**Test in a real DOM, not by reading the code.** Two bugs in a row were
misdiagnosed by reasoning about the source. `npm i jsdom`, load `content.js`
into a JSDOM window with a fake `chrome.storage` shim, build fake
`.chakra-card` elements, dispatch events. Both bugs became obvious in minutes.
Notably: check *intermediate* states, not just the end state — one bug was a
70 ms window where rows shifted, invisible to a test that only looked at the
final layout.

## Things that look wrong but are deliberate

**Translations sit in `content.js`, not `_locales/`.** The user maintains this
by copying files between folders; a subtree of four `messages.json` files got
mangled in transit and the extension refused to load. Flat folder was the fix.
Cost: extension name and description in the browser's extension list are
English-only. Do not "fix" this without asking.

**"Seat free" means at most one player, not `players < maxPlayers`.**
`maxPlayers` is 6 on every single lobby regardless of the host's intent, so it
carries no information. The user's own definition: not already two people in
there.

**Card text is the primary source, the API only enriches.** An early version
had it the other way round and broke whenever API data was missing for a card
— which is often. If you touch `describe()`, keep the rule that API values
only *add*; assigning `null` from a missing API field once wiped out a
perfectly good value parsed from the card. That was the Sets bug.

**Ordering uses CSS `order`, never reparenting.** React owns those nodes.

**`setStyle()` only writes when the value changes.** Every write wakes the
MutationObserver, which triggers the next pass. Writing unconditionally caused
a flicker loop.

**The MutationObserver watches `childList` only.** Watching attributes would
feed the extension its own changes.

## The freeze logic is the fragile part

Roughly a third of the development time went into it, across four attempts.
The problem: the lobby list refreshes constantly, and a row shifting at the
moment of a click puts you in the wrong game.

Failure modes seen, in order:

1. Hold too late → rows shift under the cursor. Caused by waiting 60 ms to
   find out whether a removed lobby really closed.
2. Hold too eagerly → the list briefly doubles, because React re-renders cards
   and the old nodes were kept as placeholders alongside the new ones.
3. `mouseover`/`mouseout` as the trigger → flicker, because those fire on every
   reflow under a stationary pointer, and the extension causes reflows.
4. Pinning *all* cards rather than only visible ones → filtered-out lobbies
   reappeared on hover.

Current shape: poll the real pointer position with `elementFromPoint`; on
removal try `adoptSlot()` synchronously first, place a placeholder immediately
if that fails, re-check after 80 ms. If you change any of this, stress-test it:
fire several dozen random insert/remove/re-render events while frozen and
assert the target row never moves, sampling at 3, 10, 25 and 50 ms after each.

## Known weak points

- `findCards()` keys on the Chakra class `chakra-card`, with a
  largest-sibling-group fallback. First thing to break if Autodarts changes
  markup.
- `joinControl()` guesses which element joins a lobby: a link to `/lobbies/…`,
  else the first button in a card. **Never verified against the real site.**
  This is why auto-join has a five second countdown, and why the freeze may
  trigger on the wrong element or not at all.

  Worth settling early, and now possible: with browser access, load the
  unpacked extension, sign in, and inspect a lobby card's join control —
  what element is it, does it carry an href, what does the surrounding markup
  look like. Then pin `joinControl()` to that instead of guessing. Everything
  in the freeze logic depends on it being right.
- Badge vocabulary is a guess based on a handful of screenshots. Known
  oddities: `Tactics` and `Cricket No Score` mean Cricket without saying so.
  New mode names will read as `nodata`, which is the safe failure.
- Player names are told apart from settings by capitalisation. A guest called
  `Bermuda` in lower case would be read as a game type.
- The green frame on the frozen list attaches to whatever container
  `findCards()` identified. Never seen rendered on the real site.

## Ideas raised but not built

- Saved presets ("my 501 DO best-of-5")
- Desktop notification when a lobby matching a preset opens
- Sort by host average
- Rendering an own list instead of hiding cards
- A separate filter for doubles/group games (the two-player threshold is right
  for X01, not for everything)

## Tone the user prefers

Direct, no ceremony. They spot inconsistencies quickly and will push back —
several real bugs in this project were found by them noticing that a number in
the status line contradicted what the list showed. When they report something,
reproduce it before changing code; guessing wasted two rounds. State plainly
what was and was not verified.
