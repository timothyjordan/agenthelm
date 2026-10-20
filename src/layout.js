// Pure bridge layout data. No Three.js and no DOM, so tests can pin the
// station contract that bridge.js and locomotion.js both consume.
export const DECK = { pit: 0, raised: 0.35, pitEdge: -1.2, deckEdge: 2.8 };

export const bridgeBounds = { x: 6.8, zBack: 6.2, zForward: -4.8 };

export function floorHeightAt(x, z) {
  if (z <= DECK.pitEdge) return DECK.pit;
  if (z >= DECK.deckEdge) return DECK.raised;
  // Ramps and the centre slope rise evenly from pit to raised deck.
  const t = (z - DECK.pitEdge) / (DECK.deckEdge - DECK.pitEdge);
  return DECK.pit + t * (DECK.raised - DECK.pit);
}

const station = (id, label, x, z, eyeHeight, lookX, lookZ) => ({
  id, label,
  position: { x, z },
  floorY: floorHeightAt(x, z),
  eyeHeight,
  lookAt: { x: lookX, z: lookZ },
});

export const STATIONS = [
  station('captain', 'Captain', 0, 4.3, 1.32, 0, -8),
  station('helm', 'Helm', -1.7, -2.2, 1.52, -1.7, -6),
  station('ops', 'Ops', 1.7, -2.2, 1.52, 1.7, -6),
  station('tactical', 'Tactical', 0, 6.0, 1.56, 0, -8),
  station('science', 'Science', -5.2, 1.4, 1.52, -7.6, 1.4),
  station('engineering', 'Engineering', 5.2, 1.4, 1.52, 7.6, 1.4),
];
