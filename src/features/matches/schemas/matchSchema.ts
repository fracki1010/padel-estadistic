import { z } from 'zod';

export const matchSchema = z
  .object({
    date: z.string().min(1, 'Fecha obligatoria'),
    location: z.string().optional(),
    format: z.enum(['amistoso', 'entrenamiento', 'torneo']),
    bestOf: z.union([z.literal(3), z.literal(5)]),
    deuce: z.enum(['oro', 'ventaja']),
    teamAPlayer1Id: z.string().min(1, 'Jugador requerido'),
    teamAPlayer1Side: z.enum(['drive', 'reves']),
    teamAPlayer2Id: z.string().min(1, 'Jugador requerido'),
    teamAPlayer2Side: z.enum(['drive', 'reves']),
    teamBPlayer1Id: z.string().min(1, 'Jugador requerido'),
    teamBPlayer1Side: z.enum(['drive', 'reves']),
    teamBPlayer2Id: z.string().min(1, 'Jugador requerido'),
    teamBPlayer2Side: z.enum(['drive', 'reves']),
    notes: z.string().optional(),
    status: z.enum(['pendiente', 'en_curso', 'finalizado']),
    setsWonTeamA: z.coerce.number().min(0),
    setsWonTeamB: z.coerce.number().min(0),
    winner: z.enum(['equipoA', 'equipoB', 'none'])
  })
  .refine(
    (values) => {
      const ids = [values.teamAPlayer1Id, values.teamAPlayer2Id, values.teamBPlayer1Id, values.teamBPlayer2Id];
      return new Set(ids).size === 4;
    },
    {
      path: ['teamAPlayer1Id'],
      message: 'No se puede repetir un jugador dentro del partido'
    }
  );

export type MatchFormValues = z.infer<typeof matchSchema>;
