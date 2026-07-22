import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Wallet, Eye, EyeOff } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error('Error al actualizar la contraseña');
    } else {
      toast.success('Contraseña actualizada correctamente');
      navigate('/');
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `radial-gradient(ellipse at 0% 0%, hsl(195 60% 16%) 0%, transparent 55%),
                     radial-gradient(ellipse at 100% 100%, hsl(210 50% 12%) 0%, transparent 55%),
                     hsl(200 45% 10%)`,
      }}
    >
      <SEO
        title="Restablecer contraseña — MiCartera"
        description="Define una nueva contraseña para tu cuenta de MiCartera."
        path="https://micartera.lovable.app/reset-password"
      />
      <div className="w-full max-w-[420px]">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'hsl(200 40% 12% / 0.92)',
            backdropFilter: 'blur(40px)',
            border: '1px solid hsl(186 60% 50% / 0.10)',
          }}
        >
          <div className="pt-10 pb-4 px-8 text-center">
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))' }}
            >
              <Wallet className="w-7 h-7" style={{ color: 'hsl(200 45% 8%)' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Nueva contraseña</h1>
            <p className="text-sm text-white/40">Introduce tu nueva contraseña</p>
          </div>

          <div className="px-8 pb-8 space-y-4">
            {!validSession ? (
              <p className="text-center text-white/50 text-sm py-4">
                Enlace inválido o expirado. Solicita uno nuevo desde la pantalla de inicio de sesión.
              </p>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl text-white placeholder:text-white/25 pr-10"
                      style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Confirmar contraseña
                  </Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-xl text-white placeholder:text-white/25"
                    style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                    color: 'hsl(200 45% 8%)',
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar nueva contraseña'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}