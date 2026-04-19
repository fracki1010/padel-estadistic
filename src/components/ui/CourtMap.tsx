import type { CourtZone, MatchEvent } from '@/features/matches/types/matchEvent';

// ---------- Layout (SVG units) ----------
const CW      = 210;
const COL_W   = CW / 3;          // 70 per column (izq / centro / der)
const FONDO_H = 60;
const MEDIO_H = 48;
const RED_H   = 42;
const HALF_H  = FONDO_H + MEDIO_H + RED_H; // 150
const NET_H   = 14;
const FULL_H  = HALF_H * 2 + NET_H;        // 314

// Lateral (exterior) wall zones
const LAT_W   = 14;   // width of each lateral column
const LAT_GAP = 4;    // gap between court edge and lateral rect

const ROW_HEIGHTS: [number, number, number] = [FONDO_H, MEDIO_H, RED_H];
const ROW_Y:       [number, number, number] = [0, FONDO_H, FONDO_H + MEDIO_H];

const GRID_ZONES = [
  'fondo_izq', 'fondo_centro', 'fondo_der',
  'medio_izq', 'medio_centro', 'medio_der',
  'red_izq',   'red_centro',   'red_der',
] as const;
type GridZone = typeof GRID_ZONES[number];

const ZONE_ROW: Record<GridZone, 0 | 1 | 2> = {
  fondo_izq: 0, fondo_centro: 0, fondo_der: 0,
  medio_izq: 1, medio_centro: 1, medio_der: 1,
  red_izq:   2, red_centro:   2, red_der:   2,
};
const ZONE_COL: Record<GridZone, 0 | 1 | 2> = {
  fondo_izq: 0, fondo_centro: 1, fondo_der: 2,
  medio_izq: 0, medio_centro: 1, medio_der: 2,
  red_izq:   0, red_centro:   1, red_der:   2,
};

export const COURT_ZONES: CourtZone[] = [
  ...GRID_ZONES,
  'lateral_izq', 'lateral_der',
];

const isGrid = (z: CourtZone): z is GridZone => GRID_ZONES.includes(z as GridZone);

const ZONE_SHORT: Record<CourtZone, string> = {
  fondo_izq: 'IZQ', fondo_centro: 'CTR', fondo_der: 'DER',
  medio_izq: 'IZQ', medio_centro: 'CTR', medio_der: 'DER',
  red_izq:   'IZQ', red_centro:   'CTR', red_der:   'DER',
  lateral_izq: 'IZQ', lateral_der: 'DER',
};

const halfBounds = (zone: CourtZone) => {
  if (!isGrid(zone)) return { x: zone === 'lateral_izq' ? -(LAT_W + LAT_GAP) : CW + LAT_GAP, y: 0, w: LAT_W, h: HALF_H };
  return { x: ZONE_COL[zone] * COL_W, y: ROW_Y[ZONE_ROW[zone]], w: COL_W, h: ROW_HEIGHTS[ZONE_ROW[zone]] };
};

const fullBounds = (zone: CourtZone, team: 'A' | 'B') => {
  if (!isGrid(zone)) {
    const x = zone === 'lateral_izq' ? -(LAT_W + LAT_GAP) : CW + LAT_GAP;
    const y = team === 'A' ? 0 : HALF_H + NET_H;
    return { x, y, w: LAT_W, h: HALF_H };
  }
  const row  = ZONE_ROW[zone];
  const x    = ZONE_COL[zone] * COL_W;
  if (team === 'A') {
    return { x, y: ROW_Y[row], w: COL_W, h: ROW_HEIGHTS[row] };
  }
  const bBase = HALF_H + NET_H;
  const bRowY: [number, number, number] = [bBase + RED_H + MEDIO_H, bBase + RED_H, bBase];
  return { x, y: bRowY[row], w: COL_W, h: ROW_HEIGHTS[row] };
};

/**
 * Converts a zone recorded from a player's perspective to the fixed overhead
 * view perspective (IZQ = west/left of court, DER = east/right of court).
 *
 * The diagram has Team A at the TOP facing south. When Team A faces south,
 * their right hand = west = LEFT column of the diagram. So their DER/IZQ
 * labels are mirrored relative to the overhead column order.
 * Team B faces north, so their IZQ/DER matches the overhead column order directly.
 */
export const toOverheadZone = (zone: CourtZone, playerTeam: 'A' | 'B'): CourtZone => {
  if (playerTeam === 'B') return zone;
  // Team A faces south → their IZQ/DER is mirrored from the overhead column order
  if (!isGrid(zone)) {
    return zone === 'lateral_izq' ? 'lateral_der' : 'lateral_izq';
  }
  const mirroredCol = 2 - ZONE_COL[zone];
  return COURT_ZONES.find((z) => isGrid(z) && ZONE_ROW[z] === ZONE_ROW[zone] && ZONE_COL[z] === mirroredCol)!;
};

// ---------- CourtZonePicker ----------
// flip=true  → net arriba  (paso "¿Desde dónde?": jugador abajo, red en frente arriba)
// flip=false → net abajo   (paso "¿A qué zona fue?": vista de cancha rival normal)

const pickerZoneBounds = (zone: CourtZone, flip: boolean) => {
  const courtY = flip ? NET_H : 0;
  if (!isGrid(zone)) {
    const x = zone === 'lateral_izq' ? -(LAT_W + LAT_GAP) : CW + LAT_GAP;
    return { x, y: courtY, w: LAT_W, h: HALF_H };
  }
  const col = ZONE_COL[zone];
  const row = ZONE_ROW[zone];
  const x   = col * COL_W;
  if (!flip) {
    return { x, y: ROW_Y[row], w: COL_W, h: ROW_HEIGHTS[row] };
  }
  const flippedRowY: [number, number, number] = [
    NET_H + RED_H + MEDIO_H,
    NET_H + RED_H,
    NET_H,
  ];
  return { x, y: flippedRowY[row], w: COL_W, h: ROW_HEIGHTS[row] };
};

export const CourtZonePicker = ({
  selected,
  onSelect,
  title,
  flip = false,
}: {
  selected: CourtZone | null;
  onSelect: (z: CourtZone) => void;
  title?: string;
  flip?: boolean;
}) => {
  const netY  = flip ? 0      : HALF_H;
  const courtY = flip ? NET_H : 0;
  const h1Y   = flip ? NET_H + RED_H           : FONDO_H;
  const h2Y   = flip ? NET_H + RED_H + MEDIO_H : FONDO_H + MEDIO_H;

  const SIDE = LAT_W + LAT_GAP;

  return (
    <svg
      viewBox={`${-SIDE} 0 ${CW + 2 * SIDE} ${HALF_H + NET_H}`}
      className="w-full max-w-[280px] mx-auto rounded-xl overflow-visible select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* court surface */}
      <rect x={0} y={courtY} width={CW} height={HALF_H} fill="#1b5e35" />

      {/* lateral wall surfaces */}
      <rect x={-(SIDE)} y={courtY} width={LAT_W} height={HALF_H} fill="#2a3a4a" rx={2} />
      <rect x={CW + LAT_GAP} y={courtY} width={LAT_W} height={HALF_H} fill="#2a3a4a" rx={2} />

      {title && (
        <text x={CW / 2} y={-4} textAnchor="middle" fontSize={7}
          fill="rgba(255,255,255,0.5)" fontFamily="system-ui,sans-serif">{title}</text>
      )}

      {COURT_ZONES.map((zone) => {
        const { x, y, w, h } = pickerZoneBounds(zone, flip);
        const cx  = x + w / 2;
        const cy  = y + h / 2;
        const sel = selected === zone;
        const isLat = !isGrid(zone);
        const rowLabel = isLat ? 'EXT' : (['FONDO', 'MEDIO', 'RED'] as const)[ZONE_ROW[zone as GridZone]];
        return (
          <g key={zone} onClick={() => onSelect(zone)} style={{ cursor: 'pointer' }}>
            <rect
              x={x + 1} y={y + 1} width={w - 2} height={h - 2}
              fill={sel ? 'rgba(59,130,246,0.65)' : isLat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'}
              stroke={sel ? '#93c5fd' : isLat ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)'}
              strokeWidth={sel ? 1.5 : 1}
              strokeDasharray={isLat && !sel ? '3 2' : undefined}
              rx={isLat ? 2 : 3}
            />
            {isLat ? (
              <text
                x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize={6} fontWeight={sel ? '700' : '500'}
                fill={sel ? 'white' : 'rgba(255,255,255,0.55)'}
                fontFamily="system-ui,sans-serif"
                transform={`rotate(-90,${cx},${cy})`}
              >
                EXT
              </text>
            ) : (
              <>
                <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fontWeight={sel ? '700' : '500'}
                  fill={sel ? 'white' : 'rgba(255,255,255,0.85)'}
                  fontFamily="system-ui,sans-serif">{rowLabel}</text>
                <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="middle"
                  fontSize={7}
                  fill={sel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
                  fontFamily="system-ui,sans-serif">{ZONE_SHORT[zone]}</text>
              </>
            )}
          </g>
        );
      })}

      {/* horizontal dividers */}
      <line x1={2} y1={h1Y} x2={CW - 2} y2={h1Y} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      <line x1={2} y1={h2Y} x2={CW - 2} y2={h2Y} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {/* vertical dividers */}
      <line x1={COL_W}     y1={courtY + 2} x2={COL_W}     y2={courtY + HALF_H - 2} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={COL_W * 2} y1={courtY + 2} x2={COL_W * 2} y2={courtY + HALF_H - 2} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4 3" />
      {/* court border */}
      <rect x={1} y={courtY + 1} width={CW - 2} height={HALF_H - 2} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} rx={3} />

      {/* net bar */}
      <rect x={0} y={netY} width={CW} height={NET_H} fill="#1f2937" />
      <text x={CW / 2} y={netY + NET_H / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={6.5} fill="rgba(255,255,255,0.55)" fontFamily="system-ui,sans-serif" letterSpacing={2}>NET / RED</text>
    </svg>
  );
};

// ---------- CourtHeatmap ----------
const WINNING_TYPES = new Set([
  'winner', 'bandeja_ganadora', 'vibora_ganadora', 'globo_ganador',
  'passing_shot', 'x3_ganador', 'x4_ganador', 'recuperacion_defensiva', 'punto_largo_ganado',
]);

export type HeatmapMode = 'winners' | 'errors' | 'landing';

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
    mode === 'errors'  ? e.eventType === 'error_no_forzado' || e.eventType === 'error_forzado' :
    Boolean(e.toZone)
  );

  const countA = new Map<CourtZone, number>();
  const countB = new Map<CourtZone, number>();
  relevant.forEach((e) => {
    const pt: 'A' | 'B' = teamA.includes(e.playerId) ? 'A' : 'B';
    if (mode === 'landing') {
      if (!e.toZone) return;
      const zone = toOverheadZone(e.toZone, pt);
      if (pt === 'A')      countB.set(zone, (countB.get(zone) ?? 0) + 1);
      else if (pt === 'B') countA.set(zone, (countA.get(zone) ?? 0) + 1);
    } else {
      if (!e.courtZone) return;
      const zone = toOverheadZone(e.courtZone, pt);
      if (pt === 'A')      countA.set(zone, (countA.get(zone) ?? 0) + 1);
      else if (pt === 'B') countB.set(zone, (countB.get(zone) ?? 0) + 1);
    }
  });

  const maxCount  = Math.max(...[...countA.values(), ...countB.values()], 1);

  const colorA: [number, number, number] =
    mode === 'winners' ? [16, 185, 129] : mode === 'errors' ? [239, 68, 68] : [251, 191, 36];
  const colorB: [number, number, number] =
    mode === 'winners' ? [99, 102, 241] : mode === 'errors' ? [249, 115, 22] : [251, 191, 36];

  const renderZones = (team: 'A' | 'B') => {
    const cmap      = team === 'A' ? countA : countB;
    const [r, g, b] = team === 'A' ? colorA : colorB;
    return COURT_ZONES.map((zone) => {
      const { x, y, w, h } = fullBounds(zone, team);
      const count   = cmap.get(zone) ?? 0;
      const opacity = count > 0 ? 0.18 + (count / maxCount) * 0.65 : 0.04;
      return (
        <g key={`${team}-${zone}`}>
          <rect
            x={x + 1} y={y + 1} width={w - 2} height={h - 2}
            fill={`rgba(${r},${g},${b},${opacity})`}
            stroke={count > 0 ? `rgba(${r},${g},${b},0.45)` : 'rgba(255,255,255,0.07)'}
            strokeWidth={1}
          />
          {count > 0 && (
            <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fontWeight="700"
              fill={`rgba(${r},${g},${b},0.95)`}
              fontFamily="system-ui,monospace">{count}</text>
          )}
        </g>
      );
    });
  };

  const Bbase = HALF_H + NET_H;

  const SIDE = LAT_W + LAT_GAP;
  const vbL  = SIDE + 12;

  return (
    <svg viewBox={`${-vbL} -18 ${CW + vbL * 2} ${FULL_H + 36}`} className="w-full select-none">
      <rect x={0} y={0}     width={CW} height={HALF_H} fill="#101828" />
      <rect x={0} y={Bbase} width={CW} height={HALF_H} fill="#101828" />
      {/* lateral backgrounds */}
      <rect x={-SIDE} y={0}     width={LAT_W} height={HALF_H} fill="#101828" />
      <rect x={CW + LAT_GAP} y={0}     width={LAT_W} height={HALF_H} fill="#101828" />
      <rect x={-SIDE} y={Bbase} width={LAT_W} height={HALF_H} fill="#101828" />
      <rect x={CW + LAT_GAP} y={Bbase} width={LAT_W} height={HALF_H} fill="#101828" />

      <text x={CW / 2} y={-6} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui" letterSpacing={1} fontWeight="600">{teamALabel.toUpperCase()}</text>
      <text x={CW / 2} y={FULL_H + 14} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.45)"
        fontFamily="system-ui" letterSpacing={1} fontWeight="600">{teamBLabel.toUpperCase()}</text>

      {renderZones('A')}
      {renderZones('B')}

      {/* court lines A */}
      <line x1={0} y1={FONDO_H}           x2={CW} y2={FONDO_H}           stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={0} y1={FONDO_H + MEDIO_H} x2={CW} y2={FONDO_H + MEDIO_H} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={COL_W}     y1={0} x2={COL_W}     y2={HALF_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={COL_W * 2} y1={0} x2={COL_W * 2} y2={HALF_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={0} y={0} width={CW} height={HALF_H} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

      {/* court lines B */}
      <line x1={0} y1={Bbase + RED_H}           x2={CW} y2={Bbase + RED_H}           stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={0} y1={Bbase + RED_H + MEDIO_H} x2={CW} y2={Bbase + RED_H + MEDIO_H} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
      <line x1={COL_W}     y1={Bbase} x2={COL_W}     y2={FULL_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={COL_W * 2} y1={Bbase} x2={COL_W * 2} y2={FULL_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={0} y={Bbase} width={CW} height={HALF_H} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />

      {/* net */}
      <rect x={0} y={HALF_H} width={CW} height={NET_H} fill="#1f2937" />
      <line x1={0} y1={HALF_H}           x2={CW} y2={HALF_H}           stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <line x1={0} y1={HALF_H + NET_H}   x2={CW} y2={HALF_H + NET_H}   stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <text x={CW / 2} y={HALF_H + NET_H / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={6} fill="rgba(255,255,255,0.45)" fontFamily="system-ui" letterSpacing={3}>NET</text>

      {(['FONDO', 'MEDIO', 'RED'] as const).map((lbl, i) => (
        <text key={lbl} x={-5} y={ROW_Y[i] + ROW_HEIGHTS[i] / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={5} fill="rgba(255,255,255,0.25)" fontFamily="system-ui"
          transform={`rotate(-90,${-5},${ROW_Y[i] + ROW_HEIGHTS[i] / 2})`}>{lbl}</text>
      ))}
    </svg>
  );
};

// ---------- CourtTrajectoryFocus ----------
const courtLines = (offsetY = 0, mirror = false) => {
  const y1   = offsetY + (mirror ? RED_H        : FONDO_H);
  const y2   = offsetY + (mirror ? RED_H + MEDIO_H : FONDO_H + MEDIO_H);
  const yEnd = offsetY + HALF_H;
  return (
    <>
      <line x1={0} y1={y1}  x2={CW} y2={y1}  stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <line x1={0} y1={y2}  x2={CW} y2={y2}  stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <line x1={COL_W}     y1={offsetY} x2={COL_W}     y2={yEnd} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={COL_W * 2} y1={offsetY} x2={COL_W * 2} y2={yEnd} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={0} y={offsetY} width={CW} height={HALF_H} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
    </>
  );
};


export const CourtTrajectoryFocus = ({
  from, to, team, count, shotType,
  teamALabel = 'Equipo A',
  teamBLabel = 'Equipo B',
}: {
  from: CourtZone;
  to: CourtZone;
  team: 'A' | 'B';
  count: number;
  shotType?: string;
  teamALabel?: string;
  teamBLabel?: string;
}) => {
  const oppTeam  = team === 'A' ? 'B' : 'A';
  const fb       = fullBounds(from, team);
  const tb       = fullBounds(to, oppTeam);
  const Bbase   = HALF_H + NET_H;

  const x1 = fb.x + fb.w / 2;
  const y1 = fb.y + fb.h / 2;
  const x2 = tb.x + tb.w / 2;
  const y2 = tb.y + tb.h / 2;
  const mx = (x1 + x2) / 2;
  const my = HALF_H + NET_H / 2;

  // x3: ball hits the back wall at horizontal center, then curves to destination
  const isX3  = shotType === 'x3' || shotType === 'smash';
  const wallX = CW / 2 + (x2 - CW / 2) * 0.35;
  const wallY = team === 'A' ? FULL_H : 0;

  const SIDE = LAT_W + LAT_GAP;
  const vbL  = SIDE + 12;

  return (
    <svg viewBox={`${-vbL} -18 ${CW + vbL * 2} ${FULL_H + 36}`} className="w-full select-none">
      <rect x={0} y={0}     width={CW} height={HALF_H} fill="#060c12" />
      <rect x={0} y={Bbase} width={CW} height={HALF_H} fill="#060c12" />
      {/* lateral backgrounds */}
      <rect x={-SIDE} y={0}     width={LAT_W} height={HALF_H} fill="#060c12" />
      <rect x={CW + LAT_GAP} y={0}     width={LAT_W} height={HALF_H} fill="#060c12" />
      <rect x={-SIDE} y={Bbase} width={LAT_W} height={HALF_H} fill="#060c12" />
      <rect x={CW + LAT_GAP} y={Bbase} width={LAT_W} height={HALF_H} fill="#060c12" />

      {COURT_ZONES.flatMap((zone) => (['A', 'B'] as const).map((t) => {
        const b = fullBounds(zone, t);
        return <rect key={`dim-${t}-${zone}`} x={b.x + 1} y={b.y + 1} width={b.w - 2} height={b.h - 2} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      }))}

      <rect x={fb.x + 2} y={fb.y + 2} width={fb.w - 4} height={fb.h - 4}
        fill="rgba(59,130,246,0.45)" stroke="#93c5fd" strokeWidth={2} rx={3} />
      <text x={x1} y={y1 - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={9} fontWeight="700" fill="white" fontFamily="system-ui">ORIGEN</text>
      <text x={x1} y={y1 + 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fill="rgba(147,197,253,0.9)" fontFamily="system-ui">Eq. {team}</text>

      <rect x={tb.x + 2} y={tb.y + 2} width={tb.w - 4} height={tb.h - 4}
        fill="rgba(251,191,36,0.45)" stroke="#fbbf24" strokeWidth={2} rx={3} />
      <text x={x2} y={y2 - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={9} fontWeight="700" fill="white" fontFamily="system-ui">DESTINO</text>
      <text x={x2} y={y2 + 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fill="rgba(251,191,36,0.9)" fontFamily="system-ui">Eq. {oppTeam}</text>

      <defs>
        <marker id="trajArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.55)" />
        </marker>
        <marker id="trajArrowWall" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(251,191,36,0.85)" />
        </marker>
      </defs>

      {isX3 ? (
        <>
          {/* leg 1: origin → back wall */}
          <line x1={x1} y1={y1} x2={wallX} y2={wallY}
            stroke="rgba(255,255,255,0.5)" strokeWidth={2}
            strokeLinecap="round" markerEnd="url(#trajArrow)" />
          {/* wall bounce indicator */}
          <circle cx={wallX} cy={wallY} r={4} fill="#fbbf24" opacity={0.9} />
          <circle cx={wallX} cy={wallY} r={7} fill="none" stroke="#fbbf24" strokeWidth={1} opacity={0.5} />
          {/* leg 2: back wall → destination (curved) */}
          <path d={`M${wallX},${wallY} Q${x2},${wallY} ${x2},${y2}`}
            fill="none" stroke="rgba(251,191,36,0.75)" strokeWidth={2}
            strokeLinecap="round" strokeDasharray="5 3"
            markerEnd="url(#trajArrowWall)" />
        </>
      ) : (
        <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
          fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2}
          strokeLinecap="round" strokeDasharray="5 3"
          markerEnd="url(#trajArrow)" />
      )}

      <rect x={CW / 2 - 18} y={HALF_H + 3} width={36} height={10} fill="#1f2937" rx={4} />
      <text x={CW / 2} y={HALF_H + 9} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fontWeight="700" fill="#fbbf24" fontFamily="system-ui">{count}x</text>

      {courtLines(0, false)}
      {courtLines(Bbase, true)}

      <rect x={0} y={HALF_H} width={CW} height={NET_H} fill="#1f2937" />
      <line x1={0} y1={HALF_H}           x2={CW} y2={HALF_H}           stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <line x1={0} y1={HALF_H + NET_H}   x2={CW} y2={HALF_H + NET_H}   stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <text x={CW / 2} y={HALF_H + NET_H / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={6} fill="rgba(255,255,255,0.35)" fontFamily="system-ui" letterSpacing={3}>NET</text>

      <text x={CW / 2} y={-6} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.35)"
        fontFamily="system-ui" letterSpacing={1}>{teamALabel.toUpperCase()}</text>
      <text x={CW / 2} y={FULL_H + 14} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.35)"
        fontFamily="system-ui" letterSpacing={1}>{teamBLabel.toUpperCase()}</text>
    </svg>
  );
};
