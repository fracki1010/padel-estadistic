import { z } from 'zod';

export const matchEventSchema = z.object({
  setNumber: z.coerce.number().min(1),
  gameNumber: z.coerce.number().min(1),
  pointNumber: z.coerce.number().min(1),
  winningTeam: z.enum(['equipoA', 'equipoB']),
  playerId: z.string().min(1, 'Jugador obligatorio'),
  eventType: z.enum([
    'winner',
    'error_no_forzado',
    'error_forzado',
    'ace',
    'doble_falta',
    'punto_largo_ganado',
    'globo_ganador',
    'bandeja_ganadora',
    'vibora_ganadora',
    'passing_shot',
    'recuperacion_defensiva'
  ]),
  shotType: z.enum([
    'saque',
    'resto',
    'drive',
    'reves',
    'volea_drive',
    'volea_reves',
    'bandeja',
    'vibora',
    'smash',
    'globo',
    'salida_de_pared',
    'contra_pared',
    'otro'
  ]),
  zone: z.enum(['red', 'fondo', 'transicion']).nullable().optional(),
  notes: z.string().optional()
});

export type MatchEventFormValues = z.infer<typeof matchEventSchema>;
