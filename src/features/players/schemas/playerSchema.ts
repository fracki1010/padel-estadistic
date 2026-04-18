import { z } from 'zod';

export const playerSchema = z.object({
  firstName: z.string().min(1, 'Nombre obligatorio'),
  lastName: z.string().min(1, 'Apellido obligatorio'),
  nickname: z.string().optional(),
  dominantHand: z.enum(['derecha', 'izquierda']),
  preferredSide: z.enum(['drive', 'reves', 'indistinto']),
  active: z.boolean()
});

export type PlayerFormValues = z.infer<typeof playerSchema>;
