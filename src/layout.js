// Pure bridge layout data, scaled to the documented studio set:
// 28.75 ft (8.76 m) across the aft computer walls, 40 ft (12.19 m) from
// viewscreen to the edge of the rear console (studio construction blueprints,
// quoted on The RPF). No Three.js and no DOM, so tests pin the contract.
export const DECK = { pit: 0, raised: 0.35, pitEdge: -1, deckEdge: 1.6 };

export const bridgeBounds = { x: 3.9, zBack: 5.6, zForward: -4.7 };

export function floorHeightAt(x, z) {
  if (z <= DECK.pitEdge) return DECK.pit;
  if (z >= DECK.deckEdge) return DECK.raised;
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
  station('captain', 'Captain', 0, 2.1, 1.3, 0, -8),
  station('helm', 'Helm', -0.95, -2.7, 1.5, -0.95, -6),
  station('ops', 'Ops', 0.95, -2.7, 1.5, 0.95, -6),
  // Tactical stands on its own raised platform behind the command chairs.
  { ...station('tactical', 'Tactical', 0, 3.9, 1.54, 0, -8), floorY: 0.62 },
  station('science', 'Science', -2.7, 3.0, 1.5, -4.6, 4.4),
  station('engineering', 'Engineering', 2.7, 3.0, 1.5, 4.6, 4.4),
];
