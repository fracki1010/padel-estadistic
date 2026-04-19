import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';

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
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          setError('Email o contraseña inválidos');
          return;
        }
        setError(`Error de autenticación: ${error.code}`);
        return;
      }
      setError('No se pudo iniciar sesión');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_55%)] p-4">
      <Card className="w-full max-w-md">
        <div className="card-header">
          <h1 className="text-xl font-semibold text-slate-100">Padel Estadistic</h1>
          <p className="text-sm text-slate-400">Inicia sesión para continuar</p>
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
