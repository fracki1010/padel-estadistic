import type { CourtZone, MatchEvent } from '@/features/matches/types/matchEvent';

// ---------- Layout (SVG units) ----------
const CW = 200;
const FONDO_H = 66;
const MEDIO_H = 52;
const RED_H    = 48;
const HALF_H   = FONDO_H + MEDIO_H + RED_H; // 166
const NET_H    = 16;
const FULL_H   = HALF_H * 2 + NET_H;        // 348

const ROW_HEIGHTS = [FONDO_H, MEDIO_H, RED_H];
const ROW_Y       = [0, FONDO_H, FONDO_H + MEDIO_H];

const ZONE_ROW: Record<CourtZone, 0 | 1 | 2> = {
  fondo_izq: 0, fondo_der: 0,
  medio_izq: 1, medio_der: 1,
  red_izq:   2, red_der:   2,
};
const ZONE_COL: Record<CourtZone, 0 | 1> = {
  fondo_izq: 0, fondo_der: 1,
  medio_izq: 0, medio_der: 1,
  red_izq:   0, red_der:   1,
};

export const COURT_ZONES: CourtZone[] = [
  'fondo_izq', 'fondo_der',
  'medio_izq', 'medio_der',
  'red_izq',   'red_der',
];

const halfBounds = (zone: CourtZone) => ({
  x: ZONE_COL[zone] * (CW / 2),
  y: ROW_Y[ZONE_ROW[zone]],
  w: CW / 2,
  h: ROW_HEIGHTS[ZONE_ROW[zone]],
});

// Full-court position for each team (A at top, B at bottom, mirrored)
const fullBounds = (zone: CourtZone, team: 'A' | 'B') => {
  const row = ZONE_ROW[zone];
  const x   = ZONE_COL[zone] * (CW / 2);
  const w   = CW / 2;
  if (team === 'A') {
    return { x, y: ROW_Y[row], w, h: ROW_HEIGHTS[row] };
  }
  // Team B: red at top (near net), fondo at bottom
  const bBase  = HALF_H + NET_H;
  const bRowY  = [bBase + RED_H + MEDIO_H, bBase + RED_H, bBase]; // 0=fondo,1=medio,2=red
  return { x, y: bRowY[row], w, h: ROW_HEIGHTS[row] };
};

// ---------- CourtZonePicker ----------
export const CourtZonePicker = ({
  selected,
  onSelect,
}: {
  selected: CourtZone | null;
  onSelect: (z: CourtZone) => void;
}) => (
  <svg
    viewBox={`0 0 ${CW} ${HALF_H + NET_H}`}
    className="w-full max-w-xs mx-auto rounded-xl overflow-hidden select-none"
    style={{ touchAction: 'manipulation' }}
  >
    {/* surface */}
    <rect x={0} y={0} width={CW} height={HALF_H} fill="#1b5e35" />

    {COURT_ZONES.map((zone) => {
      const { x, y, w, h } = halfBounds(zone);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const sel = selected === zone;
      const rowLabel = ['FONDO', 'MEDIO', 'RED'][ZONE_ROW[zone]];
      const colLabel = ZONE_COL[zone] === 0 ? 'IZQ' : 'DER';
      return (
        <g key={zone} onClick={() => onSelect(zone)} style={{ cursor: 'pointer' }}>
          <rect
            x={x + 2} y={y + 2} width={w - 4} height={h - 4}
            fill={sel ? 'rgba(59,130,246,0.60)' : 'rgba(255,255,255,0.06)'}
            stroke={sel ? '#93c5fd' : 'rgba(255,255,255,0.22)'}
            strokeWidth={sel ? 2 : 1}
            rx={4}
          />
          <text
            x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontWeight={sel ? '700' : '500'}
            fill={sel ? 'white' : 'rgba(255,255,255,0.85)'}
            fontFamily="system-ui,sans-serif"
          >{rowLabel}</text>
          <text
            x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
            fontSize={8.5}
            fill={sel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
            fontFamily="system-ui,sans-serif"
          >{colLabel}</text>
        </g>
      );
    })}

    {/* lines */}
    <line x1={2} y1={FONDO_H}           x2={CW-2} y2={FONDO_H}           stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
    <line x1={2} y1={FONDO_H + MEDIO_H} x2={CW-2} y2={FONDO_H + MEDIO_H} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
    <line x1={CW/2} y1={2} x2={CW/2} y2={HALF_H-2} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="5 4" />
    <rect x={1} y={1} width={CW-2} height={HALF_H-2} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} rx={3} />

    {/* net bar */}
    <rect x={0} y={HALF_H} width={CW} height={NET_H} fill="#1f2937" />
    <text
      x={CW/2} y={HALF_H + NET_H/2 + 1} textAnchor="middle" dominantBaseline="middle"
      fontSize={7} fill="rgba(255,255,255,0.55)" fontFamily="system-ui,sans-serif" letterSpacing={2}
    >NET / RED</text>
  </svg>
);

// ---------- CourtHeatmap ----------
const WINNING_TYPES = new Set([
  'winner','bandeja_ganadora','vibora_ganadora','globo_ganador',
  'passing_shot','x3_ganador','x4_ganador','recuperacion_defensiva','punto_largo_ganado',
]);

export type HeatmapMode = 'winners' | 'errors';

interface CourtHeatmapProps {
  events:      MatchEvent[];
  teamA:       string[];
  teamB:       string[];
  mode:        HeatmapMode;
  teamALabel?: string;
  teamBLabel?: string;
}

export const CourtHeatmap = ({
  events, teamA, teamB, mode,
  teamALabel = 'Equipo A',
  teamBLabel = 'Equipo B',
}: CourtHeatmapProps) => {
  const relevant = events.filter((e) =>
    mode === 'winners' ? WINNING_TYPES.has(e.eventType) :
    e.eventType === 'error_no_forzado' || e.eventType === 'error_forzado'
  );

  const countA = new Map<CourtZone, number>();
  const countB = new Map<CourtZone, number>();
  relevant.forEach((e) => {
    if (!e.courtZone) return;
    if (teamA.includes(e.playerId)) countA.set(e.courtZone, (countA.get(e.courtZone) ?? 0) + 1);
    else if (teamB.includes(e.playerId)) countB.set(e.courtZone, (countB.get(e.courtZone) ?? 0) + 1);
  });

  const allCounts = [...countA.values(), ...countB.values()];
  const maxCount  = Math.max(...allCounts, 1);

  // Team A: emerald (winners) / red (errors)   Team B: indigo / orange
  const colorA: [number,number,number] = mode === 'winners' ? [16,185,129]  : [239,68,68];
  const colorB: [number,number,number] = mode === 'winners' ? [99,102,241]  : [249,115,22];

  const renderZones = (team: 'A' | 'B') => {
    const cmap  = team === 'A' ? countA : countB;
    const [r,g,b] = team === 'A' ? colorA : colorB;
    return COURT_ZONES.map((zone) => {
      const { x, y, w, h } = fullBounds(zone, team);
      const count   = cmap.get(zone) ?? 0;
      const opacity = count > 0 ? 0.18 + (count / maxCount) * 0.65 : 0.04;
      return (
        <g key={`${team}-${zone}`}>
          <rect
            x={x+1} y={y+1} width={w-2} height={h-2}
            fill={`rgba(${r},${g},${b},${opacity})`}
            stroke={count > 0 ? `rgba(${r},${g},${b},0.45)` : 'rgba(255,255,255,0.07)'}
            strokeWidth={1}
          />
          {count > 0 && (
            <text
              x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle"
              fontSize={12} fontWeight="700"
              fill={`rgba(${r},${g},${b},0.95)`}
              fontFamily="system-ui,monospace"
            >{count}</text>
          )}
        </g>
      );
    });
  };

  const Bbase = HALF_H + NET_H;

  return (
    <svg
      viewBox={`-12 -18 ${CW+24} ${FULL_H+36}`}
      className="w-full select-none"
    >
      {/* surfaces */}
      <rect x={0} y={0}      width={CW} height={HALF_H} fill="#0d2b17" />
      <rect x={0} y={Bbase}  width={CW} height={HALF_H} fill="#101828" />

      {/* team labels */}
      <text x={CW/2} y={-6} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui" letterSpacing={1} fontWeight="600">{teamALabel.toUpperCase()}</text>
      <text x={CW/2} y={FULL_H+14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui" letterSpacing={1} fontWeight="600">{teamBLabel.toUpperCase()}</text>

      {renderZones('A')}
      {renderZones('B')}

      {/* court lines A */}
      <line x1={0} y1={FONDO_H}           x2={CW} y2={FONDO_H}           stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={0} y1={FONDO_H+MEDIO_H}   x2={CW} y2={FONDO_H+MEDIO_H}   stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={CW/2} y1={0} x2={CW/2} y2={HALF_H}  stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={0} y={0} width={CW} height={HALF_H} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

      {/* court lines B */}
      <line x1={0} y1={Bbase+RED_H}        x2={CW} y2={Bbase+RED_H}        stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={0} y1={Bbase+RED_H+MEDIO_H} x2={CW} y2={Bbase+RED_H+MEDIO_H} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={CW/2} y1={Bbase} x2={CW/2} y2={FULL_H} stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={0} y={Bbase} width={CW} height={HALF_H} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

      {/* net */}
      <rect x={0} y={HALF_H} width={CW} height={NET_H} fill="#1f2937" />
      <line x1={0} y1={HALF_H}       x2={CW} y2={HALF_H}       stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <line x1={0} y1={HALF_H+NET_H} x2={CW} y2={HALF_H+NET_H} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <text x={CW/2} y={HALF_H+NET_H/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={6.5} fill="rgba(255,255,255,0.45)" fontFamily="system-ui" letterSpacing={3}>NET</text>

      {/* side zone labels */}
      {(['FONDO','MEDIO','RED'] as const).map((lbl, i) => (
        <text
          key={lbl}
          x={-5} y={ROW_Y[i] + ROW_HEIGHTS[i] / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={5.5} fill="rgba(255,255,255,0.25)"
          fontFamily="system-ui"
          transform={`rotate(-90,${-5},${ROW_Y[i] + ROW_HEIGHTS[i] / 2})`}
        >{lbl}</text>
      ))}
    </svg>
  );
};
