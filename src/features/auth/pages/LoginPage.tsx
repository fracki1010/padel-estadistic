import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await authService.login(values.email, values.password);
      navigate(from, { replace: true });
    } catch {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 p-4">
      <Card className="w-full max-w-md">
        <div className="card-header">
          <h1 className="text-xl font-semibold text-slate-800">Padel Estadistic</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>
        <form className="card-body space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit" loading={isSubmitting}>
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
};
