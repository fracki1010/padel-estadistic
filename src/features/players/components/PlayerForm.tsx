import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { playerSchema, type PlayerFormValues } from '@/features/players/schemas/playerSchema';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface Props {
  initialValues?: PlayerFormValues;
  onSubmit: (values: PlayerFormValues) => Promise<void>;
  loading: boolean;
}

const defaults: PlayerFormValues = {
  firstName: '',
  lastName: '',
  nickname: '',
  dominantHand: 'derecha',
  preferredSide: 'indistinto',
  active: true
};

export const PlayerForm = ({ initialValues, onSubmit, loading }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: initialValues ?? defaults
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Apellido" error={errors.lastName?.message} {...register('lastName')} />
      </div>
      <Input label="Apodo" error={errors.nickname?.message} {...register('nickname')} />
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Mano dominante" error={errors.dominantHand?.message} {...register('dominantHand')}>
          <option value="derecha">Derecha</option>
          <option value="izquierda">Izquierda</option>
        </Select>
        <Select label="Posición preferida" error={errors.preferredSide?.message} {...register('preferredSide')}>
          <option value="drive">Drive</option>
          <option value="reves">Revés</option>
          <option value="indistinto">Indistinto</option>
        </Select>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register('active')} /> Activo
      </label>
      <Button type="submit" loading={loading}>
        Guardar jugador
      </Button>
    </form>
  );
};
