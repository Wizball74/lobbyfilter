// Runs in the MAIN world, i.e. the same JS context as the Autodarts app.
// Job: tap fetch and WebSocket and forward every lobby object found to
// content.js via postMessage.
(() => {
  'use strict';

  // Recognises a lobby object by its shape, not its position in the JSON.
  // That keeps the tap independent of how Autodarts wraps its messages.
  function looksLikeLobby(o) {
    return (
      o && typeof o === 'object' && !Array.isArray(o) &&
      typeof o.id === 'string' &&
      typeof o.variant === 'string' &&
      typeof o.maxPlayers === 'number' &&
      o.settings && typeof o.settings === 'object'
    );
  }

  function collectLobbies(node, out, depth) {
    out = out || [];
    depth = depth || 0;
    if (!node || typeof node !== 'object' || depth > 8) return out;
    if (looksLikeLobby(node)) {
      out.push(node);
      return out; // do not descend further
    }
    if (Array.isArray(node)) {
      for (const v of node) collectLobbies(v, out, depth + 1);
      return out;
    }
    for (const k in node) {
      const v = node[k];
      if (v && typeof v === 'object') collectLobbies(v, out, depth + 1);
    }
    return out;
  }

  function publish(list, source) {
    if (!list || !list.length) return;
    window.postMessage({ __adlf: 'lobbies', source, lobbies: list }, location.origin);
  }

  // --- fetch ---------------------------------------------------------------
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const first = args[0];
      const url = String(first && first.url ? first.url : first || '');
      if (url.indexOf('/lobbies') !== -1) {
        res.clone().json()
          .then((j) => publish(collectLobbies(j), 'rest'))
          .catch(() => {});
      }
    } catch (_) { /* ignore */ }
    return res;
  };

  // --- WebSocket -----------------------------------------------------------
  // Proxy rather than a wrapper function so constants like WebSocket.OPEN
  // and the app's own instanceof checks keep working.
  const OrigWS = window.WebSocket;
  window.WebSocket = new Proxy(OrigWS, {
    construct(Target, args) {
      const ws = new Target(...args);
      ws.addEventListener('message', (ev) => {
        const d = ev.data;
        if (typeof d !== 'string' || d.indexOf('"variant"') === -1) return;
        try { publish(collectLobbies(JSON.parse(d)), 'ws'); } catch (_) {}
      });
      return ws;
    }
  });

  console.log('%c[Lobby Filter] hooks active', 'color:#7ee787;font-weight:bold');
})();
