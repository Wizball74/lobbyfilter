// Liest die Lobbykarten, filtert, sortiert und reichert mit den API-Daten an.
// Primaerquelle ist immer der sichtbare Kartentext; die API liefert nur, was
// dort nicht steht (Average, Land, Schiri, exakte Spielerzahl, maxPlayers).
(() => {
  'use strict';

  const STORE_KEY = 'adlf_filters';

  // Translations live here rather than in _locales/ on purpose: it keeps the
  // extension a flat folder with no subtrees. Language follows the browser,
  // falling back to English.
  const STRINGS = {
    en: {
      fVariant: "Game",
      fOut: "Out",
      fIn: "In",
      fBull: "Bull",
      fScore: "Points",
      fLegs: "Legs",
      fSets: "Sets",
      fAverage: "Average",
      fCountry: "Country",
      optAll: "all",
      optAllCount: "all ($1)",
      phAny: "any",
      cFreeSeat: "seat free",
      cHideEmpty: "hide empty",
      cSortByScore: "sort by points",
      cOnlyBullOff: "with bull-off only",
      cOnlyReferee: "with referee only",
      cHideNoDetails: "hide lobbies without details",
      cAutoJoin: "Auto-join as soon as a seat is free",
      bAdvanced: "Advanced",
      bReset: "Reset",
      bCancel: "Cancel",
      aDecrease: "decrease $1",
      aIncrease: "increase $1",
      aClear: "clear $1",
      sCount: "$1 of $2 lobbies",
      sNoDetails: "$1 without details",
      ttNoData: "A filter needs data this lobby doesn't show (country/referee) and it hasn't arrived, so it can't be filtered for sure — shown just in case.",
      sJoinIn: "Matching lobby found — joining in $1 s",
      sFrozen: "List held while you aim",
      vAll: "all ($1)",
      vSome: "$1 game types",
      vNone: "none selected",
      sFrozenMore: "List held · $1 waiting",
    },
    de: {
      fVariant: "Spielart",
      fOut: "Out",
      fIn: "In",
      fBull: "Bull",
      fScore: "Punkte",
      fLegs: "Legs",
      fSets: "Sets",
      fAverage: "Average",
      fCountry: "Land",
      optAll: "alle",
      optAllCount: "alle ($1)",
      phAny: "egal",
      cFreeSeat: "Platz frei",
      cHideEmpty: "leere ausblenden",
      cSortByScore: "nach Punkten sortieren",
      cOnlyBullOff: "nur mit Bull-off",
      cOnlyReferee: "nur mit Schiri",
      cHideNoDetails: "Lobbys ohne Detaildaten ausblenden",
      cAutoJoin: "Auto-Join, sobald freier Platz",
      bAdvanced: "Erweitert",
      bReset: "Zurücksetzen",
      bCancel: "Abbrechen",
      aDecrease: "$1 verringern",
      aIncrease: "$1 erhöhen",
      aClear: "$1 zurücksetzen",
      sCount: "$1 von $2 Lobbys",
      sNoDetails: "$1 ohne Detaildaten",
      ttNoData: "Ein Filter braucht Daten, die diese Lobby nicht anzeigt (Land/Schiri) und die noch nicht angekommen sind – sie kann nicht sicher gefiltert werden und wird sicherheitshalber angezeigt.",
      sJoinIn: "Passende Lobby gefunden — Beitritt in $1 s",
      sFrozen: "Liste angehalten, solange du zielst",
      vAll: "alle ($1)",
      vSome: "$1 Spielarten",
      vNone: "keine gewählt",
      sFrozenMore: "Liste angehalten · $1 warten",
    },
    nl: {
      fVariant: "Spelsoort",
      fOut: "Out",
      fIn: "In",
      fBull: "Bull",
      fScore: "Punten",
      fLegs: "Legs",
      fSets: "Sets",
      fAverage: "Gemiddelde",
      fCountry: "Land",
      optAll: "alle",
      optAllCount: "alle ($1)",
      phAny: "maakt niet uit",
      cFreeSeat: "plek vrij",
      cHideEmpty: "lege verbergen",
      cSortByScore: "op punten sorteren",
      cOnlyBullOff: "alleen met bull-off",
      cOnlyReferee: "alleen met scheidsrechter",
      cHideNoDetails: "lobby's zonder details verbergen",
      cAutoJoin: "Automatisch deelnemen zodra er plek vrij is",
      bAdvanced: "Geavanceerd",
      bReset: "Wissen",
      bCancel: "Annuleren",
      aDecrease: "$1 verlagen",
      aIncrease: "$1 verhogen",
      aClear: "$1 wissen",
      sCount: "$1 van $2 lobby's",
      sNoDetails: "$1 zonder details",
      ttNoData: "Een filter heeft gegevens nodig die deze lobby niet toont (land/scheidsrechter) en die nog niet binnen zijn – hij kan niet zeker gefilterd worden en blijft voor de zekerheid zichtbaar.",
      sJoinIn: "Passende lobby gevonden — deelnemen over $1 s",
      sFrozen: "Lijst staat stil terwijl je richt",
      vAll: "alle ($1)",
      vSome: "$1 spelsoorten",
      vNone: "geen gekozen",
      sFrozenMore: "Lijst staat stil · $1 wachten",
    },
    fr: {
      fVariant: "Variante",
      fOut: "Sortie",
      fIn: "Entrée",
      fBull: "Bull",
      fScore: "Points",
      fLegs: "Legs",
      fSets: "Sets",
      fAverage: "Moyenne",
      fCountry: "Pays",
      optAll: "toutes",
      optAllCount: "toutes ($1)",
      phAny: "peu importe",
      cFreeSeat: "place libre",
      cHideEmpty: "masquer les vides",
      cSortByScore: "trier par points",
      cOnlyBullOff: "avec bull-off uniquement",
      cOnlyReferee: "avec arbitre uniquement",
      cHideNoDetails: "masquer les lobbys sans détails",
      cAutoJoin: "Rejoindre dès qu'une place se libère",
      bAdvanced: "Avancé",
      bReset: "Réinitialiser",
      bCancel: "Annuler",
      aDecrease: "diminuer $1",
      aIncrease: "augmenter $1",
      aClear: "effacer $1",
      sCount: "$1 lobbys sur $2",
      sNoDetails: "$1 sans détails",
      ttNoData: "Un filtre a besoin de données que ce salon n'affiche pas (pays/arbitre) et qui ne sont pas encore arrivées : il ne peut pas être filtré avec certitude et reste affiché par précaution.",
      sJoinIn: "Lobby correspondant trouvé — connexion dans $1 s",
      sFrozen: "Liste figée pendant que vous visez",
      vAll: "toutes ($1)",
      vSome: "$1 variantes",
      vNone: "aucune choisie",
      sFrozenMore: "Liste figée · $1 en attente",
    },
  };

  const LANG = (() => {
    const ui = (chrome.i18n && chrome.i18n.getUILanguage
      ? chrome.i18n.getUILanguage() : navigator.language || 'en');
    const base = String(ui).toLowerCase().split('-')[0];
    return STRINGS[base] ? base : 'en';
  })();

  const t = (key, ...subs) => {
    const raw = STRINGS[LANG][key] || STRINGS.en[key] || key;
    return raw.replace(/\$(\d)/g, (m, i) => String(subs[i - 1] ?? m));
  };
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const MODE_RE = /^([SDM])I-([SDM])O$/i;
  const MODE_MAP = { S: 'Straight', D: 'Double', M: 'Master' };
  // Badges that describe a setting. Checked as "consists only of these words"
  // so combinations like "Standard Hidden" are recognised too, instead of
  // passing as a player name.
  const SETTING_WORD = /^(?:standard|cut|throat|tactics|cricket|no|score|hidden|privat|private|schiri|referee|bull|off|bull-off|freeze|random|shanghai|bermuda|gotcha|count|up|around|the|clock|round|world|atc|rtw|segment|training|checkout|mode|open|master|straight|double|in|out)$/i;
  const isSettingBadge = (s) =>
    s.split(/[\s\-/|,]+/).filter(Boolean).every((w) => SETTING_WORD.test(w));
  const RANGE_TOKEN = /^\d+\s*-\s*\d+$/;
  const ROUNDS_TOKEN = /^(?:max\.?\s*)?\d+\s*(?:runden|rounds|r)$/i;
  const AVG_BADGE = /^\d{1,3}\+$/;
  // Legs and sets, language- and spelling-independent: a number followed by
  // L/Leg/Legs or S/Set/Sets, in any order, possibly both in one badge.
  // Matches "First to 3L", "3 Legs", "2 Sets 3 Legs", "Erster zu 3L".
  // Deliberately does not match "MASL04" — the number must come first.
  const LEG_TOKEN = /(\d+)\s*(?:l\b|legs?\b)/i;
  const SET_TOKEN = /(\d+)\s*(?:s\b|sets?\b)/i;
  const LEG_SET_TOKEN = /^[^\d]*\d+\s*(?:l\b|legs?\b|s\b|sets?\b)[\s\d/]*(?:l\b|legs?\b|s\b|sets?\b)?\s*$/i;

  // Variant detection matches word boundaries, not exact equality: Autodarts
  // packs several settings into one badge ("Cricket No Score").
  // Order matters — first match wins.
  const VARIANT_PATTERNS = [
    [/\brandom\s*checkout\b/i,          'Random Checkout'],
    [/\bsegment\s*training\b/i,         'Segment Training'],
    [/\baround\s*the\s*clock\b|\batc\b/i, 'ATC'],
    [/\bround\s*the\s*world\b|\brtw\b/i,  'RTW'],
    [/\bcount\s*-?\s*up\b/i,            'CountUp'],
    [/\bcricket\b|\btactics\b|\bcut\s*-?\s*throat\b|\bno\s*score\b/i, 'Cricket'],
    [/\bshanghai\b/i,                    'Shanghai'],
    [/\bbermuda\b/i,                     'Bermuda'],
    [/\bgotcha\b/i,                      'Gotcha'],
    [/\bbob'?s?\s*27\b/i,                "Bob's 27"]
  ];

  const BASE_SCORES = [301, 501, 701, 901, 1001];

  // Fixed order: every known variant stays selectable, even when none is
  // currently open.
  const VARIANT_ORDER = [
    'X01', 'Cricket', 'Random Checkout', 'ATC', 'RTW',
    'Shanghai', 'Bermuda', 'Gotcha', 'CountUp', "Bob's 27", 'Segment Training'
  ];

  const VARIANT_NAMES = {
    X01: 'X01', Cricket: 'Cricket', Shanghai: 'Shanghai', Bermuda: 'Bermuda',
    Gotcha: 'Gotcha', 'Random Checkout': 'Random Checkout', CountUp: 'Count Up',
    ATC: 'Around the Clock', RTW: 'Round the World',
    "Bob's 27": "Bob's 27", 'Segment Training': 'Segment Training'
  };

  const DEFAULTS = {
    // Multi-selects. These must live here, not only in the start-up guards:
    // isDefault() treats an empty selection as "default" only when the default
    // is itself an array, and reset() rebuilds filters from DEFAULTS alone.
    // Leaving them out made the Advanced badge count baseScores/bullModes/
    // countries as always-active, and made reset() drop them to undefined.
    variants: [], inModes: [], outModes: [], baseScores: [],
    bullModes: [], countries: [],
    legs: '', sets: '',
    onlyBullOff: false, onlyReferee: false,
    freeSeat: false, hideEmpty: false, sortByScore: false,
    avgMin: '', avgMax: '',
    hideNoDetails: false, showAdvanced: false, autoJoin: false
  };
  const ADVANCED_KEYS = [
    'baseScores', 'bullModes', 'sets', 'onlyBullOff',
    'onlyReferee', 'avgMin', 'avgMax', 'countries', 'hideNoDetails'
  ];

  const lobbies = new Map();
  let filters = null;
  let panel = null;
  let pending = null;
  let busy = false;
  let variantsSeen = '';
  let countriesSeen = '';
  let joinTimer = null;

  // Freezing: while the pointer rests on a join button the list must not
  // move. Otherwise you click the lobby that shifted into place at that very
  // moment.
  const freeze = {
    on: false,
    container: null,
    order: new Map(),   // card -> pinned position
    next: 0,            // next position for lobbies that arrive while frozen
    ghosts: new Set(),  // placeholders for lobbies the site removed
    timer: null,        // failsafe
    leave: null,        // debounced thaw
    anchor: null        // button the pointer is resting on
  };

  /* ---------------------------------------------------------------- Daten */

  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.__adlf !== 'lobbies') return;
    if (d.source === 'rest' && d.lobbies.length > 3) lobbies.clear();
    for (const l of d.lobbies) if (l && l.id) lobbies.set(String(l.id).toLowerCase(), l);
    schedule();
  });

  /* --------------------------------------------------------- Karte lesen */

  function leafNodes(root) {
    const out = [];
    (function walk(n) {
      for (const c of n.children) {
        if (c.children.length === 0) {
          const t = (c.textContent || '').trim();
          if (t) out.push({ node: c, text: t });
        } else walk(c);
      }
    })(root);
    return out;
  }

  function parseCard(card) {
    const d = {
      variant: null, baseScore: null, inMode: null, outMode: null,
      legs: null, sets: null, bullOff: false, avgBadges: 0, avgBuckets: [],
      otherTokens: 0
    };
    card.querySelectorAll('.adlf-player').forEach((n) => n.classList.remove('adlf-player'));
    for (const { node, text: raw } of leafNodes(card)) {
      const s = raw.trim();
      // "35+" is a 5-wide average bucket. Keep the value, not just the count —
      // the average filter matches against it, so what the card shows is what
      // filters. parseInt drops the trailing "+".
      if (AVG_BADGE.test(s)) { d.avgBadges++; d.avgBuckets.push(parseInt(s, 10)); continue; }
      if (/^\d{3,4}$/.test(s)) {
        const n = Number(s);
        if (n >= 101 && n <= 1001) { d.baseScore = n; d.variant = 'X01'; continue; }
      }
      const m = s.match(MODE_RE);
      if (m) {
        d.inMode = MODE_MAP[m[1].toUpperCase()];
        d.outMode = MODE_MAP[m[2].toUpperCase()];
        continue;
      }
      // Also matches annotated variants like "Bull-off (Official)"; still a
      // bull-off, and must not fall through to being read as a player name.
      if (/^bull[-\s]?off\b/i.test(s)) { d.bullOff = true; continue; }
      // Language independent: any text, a number, then L or S at the end.
      // Matches "First to 3L", "Erster zu 3L", "3L" — but not "MASL04".
      if (LEG_SET_TOKEN.test(s)) {
        const lm = s.match(LEG_TOKEN);
        const sm = s.match(SET_TOKEN);
        if (lm) d.legs = Number(lm[1]);
        if (sm) d.sets = Number(sm[1]);
        if (lm || sm) continue;
      }
      // ATC and RTW are acronym game types, always all-caps, so the
      // "upper-case = player name" rule below would misread them (an ATC-only
      // lobby then looks occupied instead of empty). They are unambiguous
      // enough to match on their own — unlike a word variant, where a guest
      // "BERMUDA" must stay a name.
      if (/^(?:atc|rtw)$/i.test(s)) { if (!d.variant) d.variant = s.toUpperCase(); continue; }

      // Card names are upper-case throughout, settings are not. Protects a
      // guest called "BERMUDA" from being read as a game type.
      const shouty = s.length > 2 && s === s.toUpperCase() && /[A-ZÄÖÜ]/.test(s);

      // Detect the variant from the words present. "Cricket No Score" and
      // "Tactics" both mean Cricket.
      let known = false;
      if (!shouty) {
        for (const [re, value] of VARIANT_PATTERNS) {
          if (re.test(s)) { if (!d.variant) d.variant = value; known = true; break; }
        }
      }
      if (known) continue;
      if (!shouty && (isSettingBadge(s) || RANGE_TOKEN.test(s) || ROUNDS_TOKEN.test(s))) continue;
      // A bare number (a stray leg/set count shown as "1") is never a name.
      if (/^\d+$/.test(s)) continue;
      // A CPU opponent ("BOT LEVEL 4") is not a real player — a lobby with only
      // bots should read as empty. This is the fallback when no API data has
      // arrived; with API data, cpuPPR entries are dropped in describe(). Name
      // match only, so a localised bot name would slip through until the DOM is
      // known.
      if (/^bot\s+level\s+\d+$/i.test(s)) continue;
      // Not a known setting badge, so it is a player name. Guests without an
      // account have neither avatar nor average badge and would otherwise look
      // like a setting. Mark it visibly.
      d.otherTokens++;
      node.classList.add('adlf-player');
    }
    return d;
  }

  // Lower bound on the player count. 0 reliably means empty.
  function visiblePlayers(card, parsed) {
    const avatars = card.querySelectorAll(
      'img[src*="avatar"], img[src*="gravatar"], img[src*="googleusercontent"]'
    ).length;
    return Math.max(avatars, parsed.avgBadges, parsed.otherTokens);
  }

  function describe(card, lobby) {
    const p = parseCard(card);
    const d = {
      variant: p.variant, baseScore: p.baseScore,
      inMode: p.inMode, outMode: p.outMode,
      legs: p.legs, sets: p.sets, bullOff: p.bullOff,
      bullMode: null, referee: null, avg: null, country: null,
      avgBuckets: p.avgBuckets,
      players: visiblePlayers(card, p), playersExact: false, maxPlayers: null
    };
    if (!lobby) return d;

    const s = lobby.settings || {};
    const host = lobby.host || {};
    if (lobby.variant) d.variant = lobby.variant;
    if (s.baseScore != null) d.baseScore = s.baseScore;
    if (s.inMode) d.inMode = s.inMode;
    if (s.outMode) d.outMode = s.outMode;
    if (s.bullMode) d.bullMode = s.bullMode;
    // Only override what the API actually carries. A lobby object without a
    // sets field says nothing about sets — it must not erase what the card
    // showed.
    if (lobby.legs != null) d.legs = lobby.legs;
    if (lobby.sets != null) d.sets = lobby.sets;
    d.bullOff = (lobby.bullOffMode || 'Off') !== 'Off';
    d.referee = !!lobby.hasReferee;
    d.avg = typeof host.average === 'number' ? host.average : null;
    d.country = host.country || '';
    // Count real players only: a CPU opponent (cpuPPR set) does not make a
    // lobby occupied — a bot-only lobby reads as empty.
    if (Array.isArray(lobby.players)) {
      d.players = lobby.players.filter((pl) => pl.cpuPPR == null).length;
      d.playersExact = true;
    }
    if (lobby.maxPlayers != null) d.maxPlayers = lobby.maxPlayers;
    return d;
  }

  /* ------------------------------------------------------------- Filtern */

  // 'yes' | 'no' | 'nodata' — 'nodata', wenn ein aktiver Filter ein Feld
  // braucht, das nur die API liefert und die hier nicht angekommen ist.
  // When a non-X01 game type is selected, points/in/out/bull are greyed out
  // in the UI. They must stop filtering too — otherwise a filter the bar
  // shows as disabled still takes effect.
  function x01Context() {
    return filters.variants.length === 0 || filters.variants.includes('X01');
  }

  function decide(d) {
    const f = filters;
    const x01 = x01Context();
    let missing = false;
    let pass = true;

    // Field applies to every game type. If absent, it is a real data gap.
    const need = (active, value, ok) => {
      if (!active) return;
      if (value === null || value === undefined) { missing = true; return; }
      if (!ok(value)) pass = false;
    };

    // X01-only field. If it is absent and the game type is known, it simply
    // does not exist for this lobby — Cricket has no starting score. That is
    // not a gap, it is a non-match.
    const needX01 = (active, value, ok) => {
      if (!active) return;
      if (value === null || value === undefined) {
        if (d.variant) pass = false;
        else missing = true;
        return;
      }
      if (!ok(value)) pass = false;
    };

    need(f.variants.length > 0, d.variant, (v) => f.variants.includes(v));
    needX01(x01 && f.baseScores.length > 0, d.baseScore, (v) => f.baseScores.includes(Number(v)));
    needX01(x01 && f.outModes.length > 0, d.outMode, (v) => f.outModes.includes(v));
    needX01(x01 && f.inModes.length > 0, d.inMode, (v) => f.inModes.includes(v));
    needX01(x01 && f.bullModes.length > 0, d.bullMode, (v) => f.bullModes.includes(v));
    need(f.onlyReferee, d.referee, (v) => v === true);
    need(f.countries.length > 0, d.country, (v) => f.countries.includes(v));

    // A missing leg/set count cannot match a specific number.
    if (f.legs !== '' && d.legs !== Number(f.legs)) pass = false;
    if (f.sets !== '' && d.sets !== Number(f.sets)) pass = false;
    if (f.onlyBullOff && !d.bullOff) pass = false;

    // Average is read from the card's visible "X+" buckets, not the API — what
    // you see is what filters. Match if ANY player's bucket is in the selected
    // range. No bucket at all (e.g. only guests) is a real data gap.
    if (f.avgMin !== '' || f.avgMax !== '') {
      if (!d.avgBuckets.length) missing = true;
      else {
        const lo = f.avgMin === '' ? -Infinity : +f.avgMin;
        const hi = f.avgMax === '' ? Infinity : +f.avgMax;
        if (!d.avgBuckets.some((b) => b >= lo && b <= hi)) pass = false;
      }
    }
    if (f.hideEmpty && d.players === 0) pass = false;
    // "Seat free" means room for a one-on-one: at most one player in there.
    // maxPlayers is 6 on every lobby regardless of what the host wants, so it
    // says nothing about whether a game is still joinable. The player count
    // comes off the card, so this is always decidable.
    if (f.freeSeat && d.players > 1) pass = false;

    if (!pass) return 'no';
    return missing ? 'nodata' : 'yes';
  }

  function isDefault(k) {
    const a = filters[k], b = DEFAULTS[k];
    if (Array.isArray(b)) return !Array.isArray(a) || a.length === 0;
    return a === b;
  }

  const X01_KEYS = ['baseScores', 'outModes', 'inModes', 'bullModes'];

  function counts(k) {
    return !isDefault(k) && (x01Context() || !X01_KEYS.includes(k));
  }

  function activeAdvanced() {
    let n = 0;
    for (const k of ADVANCED_KEYS) if (counts(k)) n++;
    return n;
  }

  function anyFilterActive() {
    for (const k in DEFAULTS) {
      if (k === 'showAdvanced' || k === 'sortByScore' || k === 'autoJoin') continue;
      if (counts(k)) return true;
    }
    return false;
  }

  /* ----------------------------------------------------------- DOM-Suche */

  function isLobbyList() { return /^\/lobbies\/?$/.test(location.pathname); }

  function findCards() {
    const all = Array.from(document.querySelectorAll('.chakra-card, [class*="chakra-card"]'))
      .filter((el) => !el.closest('#adlf-panel') && !el.classList.contains('adlf-ghost'));
    if (all.length < 2) return { container: null, cards: all };
    const groups = new Map();
    for (const el of all) {
      const p = el.parentElement;
      if (!p) continue;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    }
    let container = null, cards = [];
    for (const [p, list] of groups) if (list.length > cards.length) { container = p; cards = list; }
    return { container, cards };
  }

  function lobbyFor(card) {
    const found = card.outerHTML.match(UUID_RE);
    if (found) for (const raw of found) {
      const l = lobbies.get(raw.toLowerCase());
      if (l) return l;
    }
    const text = card.textContent || '';
    const byName = Array.from(lobbies.values())
      .filter((l) => l.host && l.host.name && text.includes(l.host.name));
    return byName.length === 1 ? byName[0] : null;
  }

  /* ------------------------------------------------------------- Auflauf */

  function apply() {
    if (!filters || busy) return;
    if (!isLobbyList()) { teardown(); return; }

    const { container, cards } = findCards();
    if (!cards.length) return;

    busy = true;
    try {
      ensurePanel(container);

      const rows = [];
      let shown = 0, noData = 0;

      for (const card of cards) {
        const d = describe(card, lobbyFor(card));
        const verdict = decide(d);
        if (verdict === 'nodata') noData++;
        const hide = verdict === 'no' || (verdict === 'nodata' && filters.hideNoDetails);

        if (hide && freeze.on && freeze.order.has(card)) {
          // Frozen: rejected cards stay put and only fade. Removing them
          // would pull everything below upwards.
          setStyle(card, 'display', null);
          card.classList.add('adlf-held');
          card.classList.remove('adlf-nodata');
        } else if (hide) {
          if (card.style.display !== 'none') {
            card.style.setProperty('display', 'none', 'important');
          }
          card.classList.remove('adlf-nodata', 'adlf-held');
        } else {
          setStyle(card, 'display', null);
          card.classList.remove('adlf-held');
          const noDetail = verdict === 'nodata' && anyFilterActive();
          card.classList.toggle('adlf-nodata', noDetail);
          // Native tooltip so the amber marker explains itself on hover. It is
          // an attribute, not a node — the childList observer stays asleep.
          const tip = t('ttNoData');
          if (noDetail) { if (card.title !== tip) card.title = tip; }
          else if (card.title === tip) card.removeAttribute('title');
          if (freeze.on && !freeze.order.has(card)) {
            // Arrived while frozen: append at the end.
            setStyle(card, 'order', String(freeze.next++));
            freeze.order.set(card, freeze.next);
            card.classList.add('adlf-fresh');
          }
          rows.push({ card, d });
          shown++;
        }
      }

      sortCards(container, cards, rows);
      refreshVariants(cards);
      refreshCountries();
      setStatus(shown, cards.length, noData);
      handleAutoJoin(rows);
    } finally {
      busy = false;
    }
  }

  // Ordering via the CSS order property rather than reparenting nodes —
  // otherwise React gets confused.
  function setStyle(node, prop, value) {
    const cur = node.style.getPropertyValue(prop);
    if (value === null) { if (cur) node.style.removeProperty(prop); return; }
    if (cur !== value) node.style.setProperty(prop, value);
  }

  function sortCards(container, cards, rows) {
    if (!container) return;
    if (freeze.on) return;   // positions are pinned
    if (!filters.sortByScore) {
      setStyle(container, 'display', null);
      setStyle(container, 'flex-direction', null);
      for (const c of cards) setStyle(c, 'order', null);
      return;
    }
    setStyle(container, 'display', 'flex');
    setStyle(container, 'flex-direction', 'column');
    const sorted = rows.slice().sort((a, b) => {
      const va = a.d.variant || 'zzz', vb = b.d.variant || 'zzz';
      if (va !== vb) return va === 'X01' ? -1 : vb === 'X01' ? 1 : va.localeCompare(vb);
      const sa = a.d.baseScore == null ? 1e9 : a.d.baseScore;
      const sb = b.d.baseScore == null ? 1e9 : b.d.baseScore;
      if (sa !== sb) return sa - sb;
      const la = a.d.legs == null ? 1e9 : a.d.legs;
      const lb = b.d.legs == null ? 1e9 : b.d.legs;
      return la - lb;
    });
    sorted.forEach((r, i) => setStyle(r.card, 'order', String(i)));
  }

  function teardown() {
    if (panel) { panel.remove(); panel = null; }
    cancelJoin();
  }

  // Evaluate new cards immediately so nothing flashes into view.
  function schedule(immediate) {
    if (immediate) { clearTimeout(pending); apply(); return; }
    clearTimeout(pending);
    pending = setTimeout(apply, 60);
  }

  /* ----------------------------------------------------------- Auto-Join */

  // The area that triggers freezing: the join button and what belongs to it.
  // Deliberately narrow — hovering the card itself does not freeze.
  function joinControl(node) {
    if (!node || node.nodeType !== 1) return null;
    const hit = node.closest('a[href*="/lobbies/"], button');
    if (!hit) return null;
    if (hit.closest('#adlf-panel')) return null;
    return hit.closest('.chakra-card, [class*="chakra-card"]') ? hit : null;
  }

  // Identity of a card across re-renders. React replaces the whole node on
  // hover, so a removed node is usually not a gone lobby — it is the same
  // lobby drawn again.
  function cardSignature(card) {
    const found = card.outerHTML.match(UUID_RE);
    if (found && found.length) return 'id:' + found[0].toLowerCase();
    return 'txt:' + (card.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function cardOf(node) {
    return node && node.closest
      ? node.closest('.chakra-card, [class*="chakra-card"]')
      : null;
  }

  function freezeOn(control) {
    freezeKeep();
    if (freeze.on) { if (control) freeze.anchor = control; return; }
    freeze.anchor = control || null;
    const { container, cards } = findCards();
    if (!container || !cards.length) return;

    freeze.on = true;
    freeze.container = container;
    freeze.order.clear();
    freeze.ghosts.clear();

    // Pin the visible order so later sorting or reflow cannot shift it.
    // Only cards that are visible right now get pinned — a card already
    // filtered out must stay out. Pinning it would make the "hold instead of
    // remove" rule bring it straight back.
    setStyle(container, 'display', 'flex');
    setStyle(container, 'flex-direction', 'column');
    const visible = cards.filter((c) => c.style.display !== 'none');
    const seen = new Map();
    for (const c of visible) {
      const cur = c.style.order === '' ? null : Number(c.style.order);
      seen.set(c, cur);
    }
    let i = 0;
    const sorted = visible.slice().sort((a, b) => {
      const av = seen.get(a), bv = seen.get(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    });
    for (const c of sorted) {
      setStyle(c, 'order', String(i));
      freeze.order.set(c, i);
      i++;
    }
    freeze.next = i + 1000;   // new ones land safely below

    document.documentElement.classList.add('adlf-frozen');
    if (freeze.container) freeze.container.classList.add('adlf-frozen-list');
    const st = panel && panel.querySelector('.adlf-status');
    if (st) { st.textContent = t('sFrozen'); st.classList.add('adlf-frozen-note'); }
    clearTimeout(freeze.timer);
    // Failsafe in case the leave event never arrives (navigation etc.)
    freeze.timer = setTimeout(freezeOff, 20000);
  }

  // Thawing is delayed: the page reflows on thaw, which briefly reads as the
  // pointer leaving and re-entering. Without the delay the two feed each other
  // into a flicker.
  function freezeOffSoon() {
    clearTimeout(freeze.leave);
    freeze.leave = setTimeout(freezeOff, 150);
  }

  function freezeKeep() {
    clearTimeout(freeze.leave);
    freeze.leave = null;
  }

  function freezeOff() {
    clearTimeout(freeze.leave);
    freeze.leave = null;
    if (!freeze.on) return;
    clearTimeout(freeze.timer);
    freeze.on = false;
    for (const g of freeze.ghosts) g.remove();
    freeze.ghosts.clear();
    freeze.order.clear();
    freeze.container = null;
    freeze.anchor = null;
    document.documentElement.classList.remove('adlf-frozen');
    document.querySelectorAll('.adlf-frozen-list')
      .forEach((n) => n.classList.remove('adlf-frozen-list'));
    document.querySelectorAll('.adlf-held, .adlf-fresh')
      .forEach((n) => n.classList.remove('adlf-held', 'adlf-fresh'));
    schedule(false);   // batched, not immediate — otherwise it reflows under
                       // the pointer straight away
  }

  // Inert stand-in that keeps a slot occupied. Nothing on it is clickable, so
  // a misclick does nothing at all.
  function makeGhost(card, slot) {
    if (!freeze.container) return null;
    const ghost = card.cloneNode(true);
    ghost.style.setProperty('order', String(slot));
    ghost.style.removeProperty('display');
    ghost.classList.add('adlf-ghost');
    ghost.classList.remove('adlf-fresh', 'adlf-held');
    ghost.querySelectorAll('a, button').forEach((el) => {
      el.removeAttribute('href');
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-hidden', 'true');
    });
    freeze.ghosts.add(ghost);
    freeze.container.append(ghost);
    return ghost;
  }

  function dropGhost(ghost) {
    if (!ghost) return;
    freeze.ghosts.delete(ghost);
    ghost.remove();
  }

  // The stand-in is already in place. Now find out what it was standing in
  // for: React replaces card nodes wholesale, so a removed node usually means
  // the same lobby is coming back, not that it closed.
  // Is the same lobby present as a different node? Then it was re-rendered,
  // not closed: hand the pinned slot to the new node.
  function adoptSlot(oldCard, slot) {
    const sig = cardSignature(oldCard);
    const { cards } = findCards();
    for (const c of cards) {
      if (c === oldCard) continue;
      // A card apply() already appended as "fresh" still counts: it may be the
      // re-rendered node, and it belongs in the old slot, not at the bottom.
      if (freeze.order.has(c) && !c.classList.contains('adlf-fresh')) continue;
      if (cardSignature(c) !== sig) continue;
      setStyle(c, 'order', String(slot));
      freeze.order.set(c, slot);
      c.classList.remove('adlf-fresh');
      return true;
    }
    return false;
  }

  // The stand-in is in place. Second look, in case the replacement node only
  // arrived in a later frame.
  function resolveGap(oldCard, slot, ghost) {
    if (!freeze.on || !freeze.container) { dropGhost(ghost); return; }
    if (adoptSlot(oldCard, slot)) dropGhost(ghost);
    // Otherwise genuinely gone — the stand-in stays until the list thaws.
  }

  function joinTarget(card) {
    return card.querySelector('a[href*="/lobbies/"]') ||
           card.querySelector('button:not([disabled])') ||
           null;
  }

  function cancelJoin() {
    if (joinTimer) { clearInterval(joinTimer); joinTimer = null; }
    const b = document.getElementById('adlf-joinbar');
    if (b) b.remove();
  }

  // Auto-join needs room for a one-on-one, regardless of the "seat free"
  // checkbox: joining a lobby that already has two players helps nobody.
  // An unknown count reads as "do not fire".
  function hasFreeSeat(d) {
    if (d.players === null || d.players === undefined) return false;
    return d.players <= 1;
  }

  function handleAutoJoin(rows) {
    if (!filters.autoJoin) { cancelJoin(); return; }
    if (joinTimer) return;

    const pick = rows.find((r) => hasFreeSeat(r.d));
    if (!pick) return;

    const target = joinTarget(pick.card);
    if (!target) return;

    let left = 5;
    const bar = el('div', { id: 'adlf-joinbar' }, []);
    const text = el('span', {}, []);
    const stop = el('button', {
      type: 'button', class: 'adlf-reset',
      onclick: () => { update('autoJoin', false); cancelJoin(); }
    }, [t('bCancel')]);
    bar.append(text, stop);
    (panel || document.body).append(bar);

    const tick = () => {
      text.textContent = t('sJoinIn', left);
      if (left-- <= 0) {
        cancelJoin();
        filters.autoJoin = false;
        chrome.storage.local.set({ [STORE_KEY]: filters });
        target.click();
      }
    };
    tick();
    joinTimer = setInterval(tick, 1000);
  }

  /* --------------------------------------------------------------- Panel */

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    for (const c of kids || []) n.append(c);
    return n;
  }

  function control(label, node, key) {
    return el('label', { class: 'adlf-ctl', 'data-for': key || '' },
      [el('span', {}, [label]), node]);
  }

  function stepper(key, label) {
    const input = el('input', { type: 'text', inputmode: 'numeric', placeholder: t('phAny') });
    input.value = filters[key];
    const set = (v) => {
      const n = v === '' ? '' : String(Math.max(1, Math.min(99, Number(v) || 1)));
      input.value = n;
      update(key, n);
    };
    // The way back to "any" uses the same key you came in with: one below 1
    // lands back at any.
    const step = (delta) => {
      if (input.value === '') { if (delta > 0) set('1'); return; }
      const next = Number(input.value) + delta;
      set(next < 1 ? '' : String(next));
    };
    input.addEventListener('change', (e) => set(e.target.value.trim()));
    const dec = el('button', { type: 'button', class: 'adlf-step', 'aria-label': t('aDecrease', label),
      onclick: () => step(-1) }, ['\u2212']);
    const inc = el('button', { type: 'button', class: 'adlf-step', 'aria-label': t('aIncrease', label),
      onclick: () => step(1) }, ['+']);
    const clr = el('button', { type: 'button', class: 'adlf-step adlf-clear', 'aria-label': t('aClear', label),
      onclick: () => { input.value = ''; update(key, ''); } }, ['\u00d7']);
    return control(label, el('span', { class: 'adlf-stepper' }, [dec, input, inc, clr]), key);
  }

  // Two to four values as a segmented control rather than a dropdown: one
  // click instead of open-aim-click. Multi-select — nothing pressed means all,
  // so there is no separate "all" key to compete with the real values.
  function segmented(key, options) {
    const wrap = el('div', { class: 'adlf-seg', 'data-key': key, role: 'group' }, []);
    for (const [val, text] of options) {
      const id = `adlf-${key}-${String(val).replace(/\W/g, '')}`;
      const c = el('input', { type: 'checkbox', id, value: val });
      c.checked = filters[key].includes(val);
      c.addEventListener('change', (e) => {
        const next = filters[key].filter((x) => x !== val);
        if (e.target.checked) next.push(val);
        update(key, next);
      });
      wrap.append(c, el('label', { for: id }, [text]));
    }
    return wrap;
  }

  // A dropdown that holds checkboxes. Eleven game types as loose checkboxes
  // would be a wall of tiles in the main bar; a plain <select> cannot combine.
  // This keeps the trigger as narrow as a select and still allows "Bermuda or
  // Shanghai or Cricket".
  function checkboxMenu(key, getItems) {
    const wrap = el('div', { class: 'adlf-menu', 'data-key': key }, []);
    const trigger = el('button', { type: 'button', class: 'adlf-menu-trigger',
      'aria-haspopup': 'true', 'aria-expanded': 'false' }, []);
    const list = el('div', { class: 'adlf-menu-list', role: 'group' }, []);
    list.hidden = true;

    const close = () => {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('adlf-open');
    };
    const open = () => {
      buildList();
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrap.classList.add('adlf-open');
    };

    function label() {
      const items = getItems();
      const picked = filters[key];
      if (!picked.length) return t('vAll', items.reduce((n, i) => n + i.count, 0));
      if (picked.length === 1) {
        const hit = items.find((i) => i.value === picked[0]);
        const name = hit ? hit.label : picked[0];
        return hit && hit.count ? `${name} (${hit.count})` : name;
      }
      return t('vSome', picked.length);
    }

    function paint() {
      trigger.textContent = label();
      trigger.classList.toggle('adlf-set', filters[key].length > 0);
    }

    function buildList() {
      list.textContent = '';
      for (const item of getItems()) {
        const c = el('input', { type: 'checkbox' });
        c.checked = filters[key].includes(item.value);
        c.addEventListener('change', (e) => {
          const next = filters[key].filter((x) => x !== item.value);
          if (e.target.checked) next.push(item.value);
          update(key, next);
          paint();
        });
        const row = el('label', { class: 'adlf-menu-item' },
          [c, el('span', {}, [item.label]),
           el('span', { class: 'adlf-menu-count' }, [item.count ? String(item.count) : ''])]);
        if (!item.count) row.classList.add('adlf-menu-empty');
        list.append(row);
      }
      if (filters[key].length) {
        list.append(el('button', { type: 'button', class: 'adlf-menu-clear',
          onclick: () => { update(key, []); paint(); buildList(); } }, [t('optAll')]));
      }
    }

    trigger.addEventListener('click', () => (list.hidden ? open() : close()));
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); trigger.focus(); } });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) close();
    }, true);

    wrap.append(trigger, list);
    wrap.__paint = paint;
    paint();
    return wrap;
  }

  // Multi-select: nothing ticked means all. Lets 301 and 501 be filtered
  // together, which a dropdown cannot do.
  function checkboxSet(key, values) {
    const wrap = el('div', { class: 'adlf-checks adlf-tight', 'data-key': key }, []);
    for (const v of values) {
      const c = el('input', { type: 'checkbox' });
      c.checked = filters[key].includes(v);
      c.addEventListener('change', (e) => {
        const next = filters[key].filter((x) => x !== v);
        if (e.target.checked) next.push(v);
        next.sort((a, b) => a - b);
        update(key, next);
      });
      wrap.append(el('label', { class: 'adlf-check' }, [c, String(v)]));
    }
    return wrap;
  }

  function checkbox(key, label) {
    const c = el('input', { type: 'checkbox', 'data-key': key });
    c.checked = !!filters[key];
    c.addEventListener('change', (e) => update(key, e.target.checked));
    return el('label', { class: 'adlf-check' }, [c, label]);
  }

  // 5-step dropdown. Autodarts only ever shows averages as 5-wide buckets
  // ("35+"), so a free number field just invited "why does 34 behave like 35".
  // Empty option means no bound.
  function avgSelect(key, placeholder) {
    const sel = el('select', { class: 'adlf-select', 'data-key': key });
    sel.append(el('option', { value: '' }, [placeholder]));
    for (let v = 10; v <= 100; v += 5) {
      sel.append(el('option', { value: String(v) }, [v + '+']));
    }
    sel.value = filters[key] === '' ? '' : String(filters[key]);
    sel.addEventListener('change', (e) => update(key, e.target.value));
    return sel;
  }

  function ensurePanel(container) {
    if (panel && document.body.contains(panel)) return;
    if (!container || !container.parentElement) return;

    const advanced = el('div', { class: 'adlf-advanced' }, [
      control(t('fScore'), checkboxSet('baseScores', scoreChoices()), 'baseScores'),
      control(t('fBull'), segmented('bullModes', [
        ['25/50', '25/50'], ['50', '50']
      ]), 'bullModes'),
      stepper('sets', t('fSets')),
      control(t('fAverage'), el('span', { class: 'adlf-pair' }, [
        avgSelect('avgMin', 'von'), avgSelect('avgMax', 'bis')
      ])),
      control(t('fCountry'), checkboxMenu('countries', countryChoices)),
      el('div', { class: 'adlf-checks' }, [
        checkbox('onlyBullOff', t('cOnlyBullOff')),
        checkbox('onlyReferee', t('cOnlyReferee')),
        checkbox('hideNoDetails', t('cHideNoDetails'))
      ])
    ]);
    advanced.hidden = !filters.showAdvanced;

    const toggle = el('button', {
      class: 'adlf-toggle', type: 'button',
      'aria-expanded': String(!!filters.showAdvanced),
      onclick: () => {
        filters.showAdvanced = !filters.showAdvanced;
        chrome.storage.local.set({ [STORE_KEY]: filters });
        advanced.hidden = !filters.showAdvanced;
        toggle.setAttribute('aria-expanded', String(filters.showAdvanced));
        paintToggle(toggle);
      }
    }, []);

    panel = el('div', { id: 'adlf-panel' }, [
      el('div', { class: 'adlf-bar' }, [
        control(t('fVariant'), checkboxMenu('variants', variantChoices), 'variants'),
        control(t('fIn'), segmented('inModes', [
          ['Straight', 'SI'], ['Double', 'DI'], ['Master', 'MI']
        ]), 'inModes'),
        control(t('fOut'), segmented('outModes', [
          ['Straight', 'SO'], ['Double', 'DO'], ['Master', 'MO']
        ]), 'outModes'),
        stepper('legs', t('fLegs')),
        el('div', { class: 'adlf-checks adlf-inline-checks' }, [
          checkbox('freeSeat', t('cFreeSeat')),
          checkbox('hideEmpty', t('cHideEmpty')),
          checkbox('sortByScore', t('cSortByScore'))
        ]),
        el('span', { class: 'adlf-grow' }, []),
        toggle,
        el('button', { class: 'adlf-reset', type: 'button', onclick: reset }, [t('bReset')])
      ]),
      advanced,
      el('div', { class: 'adlf-footer' }, [
        el('span', { class: 'adlf-status' }, ['–']),
        checkbox('autoJoin', t('cAutoJoin'))
      ])
    ]);

    paintToggle(toggle);
    container.parentElement.insertBefore(panel, container);
    syncDisabled();
  }

  // Fixed list plus anything else currently open or previously ticked.
  function scoreChoices() {
    const set = new Set(BASE_SCORES);
    for (const l of lobbies.values()) {
      const s = l.settings && l.settings.baseScore;
      if (typeof s === 'number') set.add(s);
    }
    for (const s of filters.baseScores) set.add(Number(s));
    return Array.from(set).sort((a, b) => a - b);
  }

  function paintToggle(btn) {
    const n = activeAdvanced();
    btn.textContent = t('bAdvanced');
    btn.classList.toggle('adlf-on', !!filters.showAdvanced);
    if (n) btn.append(el('span', { class: 'adlf-count' }, [String(n)]));
  }

  // All variants stay selectable; the number shows how many are open right
  // now. Unknown variants seen in the list are appended at the end.
  let variantCounts = new Map();

  function variantChoices() {
    const order = VARIANT_ORDER.slice();
    for (const v of Array.from(variantCounts.keys()).sort()) {
      if (!order.includes(v)) order.push(v);
    }
    for (const v of filters.variants) if (!order.includes(v)) order.push(v);
    return order.map((v) => ({
      value: v,
      label: VARIANT_NAMES[v] || v,
      count: variantCounts.get(v) || 0
    }));
  }

  function refreshVariants(cards) {
    if (!panel) return;
    const counts = new Map();
    for (const c of cards) {
      const v = parseCard(c).variant;
      if (v) counts.set(v, (counts.get(v) || 0) + 1);
    }
    const sig = Array.from(counts).sort().map((e) => e.join(':')).join('|');
    if (sig === variantsSeen) return;
    variantsSeen = sig;
    variantCounts = counts;
    const menu = panel.querySelector('.adlf-menu[data-key="variants"]');
    if (menu && menu.__paint) menu.__paint();
  }

  let countryCounts = new Map();

  function countryChoices() {
    const list = Array.from(countryCounts.keys()).sort();
    for (const c of filters.countries) if (!list.includes(c)) list.push(c);
    return list.map((c) => ({
      value: c, label: c.toUpperCase(), count: countryCounts.get(c) || 0
    }));
  }

  function refreshCountries() {
    if (!panel) return;
    const counts = new Map();
    for (const l of lobbies.values()) {
      const c = (l.host && l.host.country) || '';
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    const sig = Array.from(counts).sort().map((e) => e.join(':')).join('|');
    if (sig === countriesSeen) return;
    countriesSeen = sig;
    countryCounts = counts;
    const menu = panel.querySelector('.adlf-menu[data-key="countries"]');
    if (menu && menu.__paint) menu.__paint();
  }

  // Disable X01 settings only when X01 is definitely excluded — with a
  // multi-select, "Cricket + X01" still needs the out mode.
  function syncDisabled() {
    if (!panel) return;
    const x01 = x01Context();
    for (const key of ['outMode', 'inMode', 'baseScores']) {
      const holder = panel.querySelector(`.adlf-ctl[data-for="${key}"]`);
      if (!holder) continue;
      holder.classList.toggle('adlf-off', !x01);
      holder.querySelectorAll('input, select, button').forEach((n) => { n.disabled = !x01; });
    }
  }

  function setStatus(shown, total, noData) {
    if (!panel) return;
    const s = panel.querySelector('.adlf-status');
    if (!s) return;

    // While frozen the count is stale by design — say so instead of showing a
    // number that quietly stopped updating.
    if (freeze.on) {
      const waiting = document.querySelectorAll('.adlf-fresh').length;
      s.textContent = waiting ? t('sFrozenMore', waiting) : t('sFrozen');
      s.classList.add('adlf-frozen-note');
      const b = panel.querySelector('input[data-key="autoJoin"]');
      if (b) b.closest('.adlf-check').classList.toggle('adlf-off', b.disabled);
      return;
    }
    s.classList.remove('adlf-frozen-note');

    let txt = t('sCount', shown, total);
    if (noData && !filters.hideNoDetails) txt += ' · ' + t('sNoDetails', noData);
    s.textContent = txt;

    const box = panel.querySelector('input[data-key="autoJoin"]');
    if (box) {
      const allowed = shown === 0 && anyFilterActive();
      box.disabled = !allowed && !filters.autoJoin;
      box.closest('.adlf-check').classList.toggle('adlf-off', box.disabled);
    }
  }

  function update(key, value) {
    filters[key] = value;
    chrome.storage.local.set({ [STORE_KEY]: filters });
    if (key === 'variants') syncDisabled();
    if (key === 'autoJoin' && !value) cancelJoin();
    const btn = panel && panel.querySelector('.adlf-toggle');
    if (btn) paintToggle(btn);
    apply();
  }

  function reset() {
    const keepAdvanced = filters.showAdvanced;
    filters = Object.assign({}, DEFAULTS, { showAdvanced: keepAdvanced });
    chrome.storage.local.set({ [STORE_KEY]: filters });
    cancelJoin();
    variantsSeen = '';
    if (panel) { panel.remove(); panel = null; }
    document.querySelectorAll('.adlf-nodata').forEach((n) => n.classList.remove('adlf-nodata'));
    apply();
  }

  /* --------------------------------------------------------------- Start */

  chrome.storage.local.get(STORE_KEY, (res) => {
    filters = Object.assign({}, DEFAULTS, res[STORE_KEY] || {});

    // Migration from single value to set: carry the stored selection over.
    // Migration from single variant to a set.
    if (typeof filters.variant === 'string') {
      if (filters.variant !== 'all') filters.variants = [filters.variant];
      delete filters.variant;
      chrome.storage.local.set({ [STORE_KEY]: filters });
    }
    if (!Array.isArray(filters.variants)) filters.variants = [];

    // Migration: single-value filters became sets.
    for (const [oldKey, newKey] of [['outMode', 'outModes'], ['inMode', 'inModes'],
                                     ['bullMode', 'bullModes'], ['country', 'countries']]) {
      if (typeof filters[oldKey] === 'string') {
        if (filters[oldKey] !== 'all') filters[newKey] = [filters[oldKey]];
        delete filters[oldKey];
        chrome.storage.local.set({ [STORE_KEY]: filters });
      }
      if (!Array.isArray(filters[newKey])) filters[newKey] = [];
    }

    if (typeof filters.baseScore === 'string') {
      if (filters.baseScore !== 'all') filters.baseScores = [Number(filters.baseScore)];
      delete filters.baseScore;
      chrome.storage.local.set({ [STORE_KEY]: filters });
    }
    if (!Array.isArray(filters.baseScores)) filters.baseScores = [];

    new MutationObserver((records) => {
      if (busy) return;

      // Frozen: when the site removes a lobby, hold its place with an inert
      // placeholder. Without it everything below jumps up — at the exact
      // moment of the click.
      if (freeze.on) {
        for (const r of records) {
          for (const n of r.removedNodes) {
            if (n.nodeType !== 1 || !freeze.order.has(n)) continue;
            const slot = freeze.order.get(n);
            freeze.order.delete(n);
            // A full re-render removes and re-inserts in the same batch, so
            // the replacement is often already in the DOM. Check first — a
            // stand-in would briefly double the list.
            if (adoptSlot(n, slot)) continue;
            // Otherwise hold the space immediately and decide afterwards.
            // Waiting even 60 ms leaves a gap, and everything below jumps up
            // during exactly the window in which the click lands.
            const ghost = makeGhost(n, slot);
            setTimeout(() => resolveGap(n, slot, ghost), 80);
          }
        }
      }

      let added = false;
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.nodeType === 1 && !n.closest('#adlf-panel')) { added = true; break; }
        }
        if (added) break;
      }
      schedule(added);   // new cards immediately, everything else batched
    }).observe(document.documentElement, { childList: true, subtree: true });
    // childList only, deliberately: style and class changes almost always
    // come from the extension itself and would loop forever.

    // Freeze control: only the join button itself counts. Rather than react
    // to mouseover/mouseout — which fire on every reflow under the pointer —
    // the actual pointer position is polled.
    let lastX = -1, lastY = -1;
    document.addEventListener('mousemove', (e) => {
      lastX = e.clientX; lastY = e.clientY;
      const over = joinControl(document.elementFromPoint(lastX, lastY));
      if (over) freezeOn(over);
      else if (freeze.on) freezeOffSoon();
    }, { capture: true, passive: true });

    // Page reflowed without the pointer moving: check whether it is still on
    // a join button.
    const recheck = () => {
      if (lastX < 0) return;
      const over = joinControl(document.elementFromPoint(lastX, lastY));
      if (over) freezeOn(over);
      else if (freeze.on) freezeOffSoon();
    };

    document.addEventListener('mouseleave', () => {
      if (freeze.on) freezeOffSoon();
    }, true);

    // Keyboard use: focus on the join button freezes the same way.
    document.addEventListener('focusin', (e) => {
      const c = joinControl(e.target);
      if (c) freezeOn(c);
    }, true);
    document.addEventListener('focusout', (e) => {
      if (joinControl(e.target)) freezeOffSoon();
    }, true);
    // Thaw after the click so the list keeps running.
    document.addEventListener('click', (e) => {
      if (joinControl(e.target)) setTimeout(freezeOff, 400);
    }, true);

    setInterval(recheck, 500);

    setInterval(() => schedule(false), 1500);
    schedule(true);
  });
})();
