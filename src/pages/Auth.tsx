import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Wallet, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

const generateOrbs = () =>
  Array.from({ length: 5 }, (_, i) => ({
    id: i,
    size: 200 + Math.random() * 300,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: i * 1.2,
    duration: 8 + Math.random() * 6,
    hue: [186, 195, 200, 186, 195][i],
  }));

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'auth' | 'forgot'>('auth');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const orbs = useMemo(generateOrbs, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Cleanup RAF on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    // Capture values before the async RAF executes
    const clientX = e.clientX;
    const clientY = e.clientY;
    const currentTarget = e.currentTarget;

    rafRef.current = requestAnimationFrame(() => {
      // Guard: element may have unmounted by the time RAF fires
      if (!containerRef.current || !currentTarget) return;
      const rect = currentTarget.getBoundingClientRect();
      if (!rect) return;
      const mx = (clientX - rect.left) / rect.width;
      const my = (clientY - rect.top) / rect.height;
      const dx = (mx - 0.5) * 2;
      const dy = (my - 0.5) * 2;
      setMouse({ x: mx, y: my });
      setTilt({ x: dy * 12, y: -dx * 12 });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setMouse({ x: 0.5, y: 0.5 });
  }, []);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('Invalid login credentials') ? 'Email o contraseña incorrectos' : error.message);
    } else {
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('already registered') ? 'Este email ya está registrado' : error.message);
    } else {
      toast.success('Cuenta creada. Revisa tu email para confirmar.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(forgotEmail);
    } catch {
      toast.error('Introduce un email válido');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Error al enviar el email. Inténtalo de nuevo.');
    } else {
      setForgotSent(true);
    }
  };

  const bgStyle = {
    background: `radial-gradient(ellipse at 0% 0%, hsl(195 60% 16%) 0%, transparent 55%),
                 radial-gradient(ellipse at 100% 100%, hsl(210 50% 12%) 0%, transparent 55%),
                 hsl(200 45% 10%)`,
  };

  return (
    <main
      ref={containerRef as React.RefObject<HTMLElement>}
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={bgStyle}
      onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLElement>}
      onMouseLeave={handleMouseLeave}
    >
      <SEO
        title="Iniciar sesión — MiCartera"
        description="Accede a MiCartera para gestionar tu nómina, gastos, ahorro y objetivos financieros."
        path="https://micartera.lovable.app/auth"
      />
      {/* Animated grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(186 100% 50% / 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(186 100% 50% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: `translate(${(mouse.x - 0.5) * -10}px, ${(mouse.y - 0.5) * -10}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="pointer-events-none absolute rounded-full blur-3xl animate-pulse-glow"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, hsl(${orb.hue} 80% 50% / 0.14), transparent 70%)`,
            transform: `translate(${(mouse.x - 0.5) * -(20 + orb.id * 8)}px, ${(mouse.y - 0.5) * -(20 + orb.id * 8)}px)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.duration}s`,
          }}
        />
      ))}

      {/* Mouse spotlight */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(186 100% 50% / 0.10), transparent 50%),
                       radial-gradient(300px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(195 90% 45% / 0.05), transparent 60%)`,
          transition: 'background 0.15s ease-out',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] mx-4"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute -inset-[1px] rounded-3xl opacity-70"
          style={{
            background: `conic-gradient(from ${mouse.x * 360}deg at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(186 100% 50% / 0.45), transparent 35%, hsl(195 90% 50% / 0.30), transparent 70%, hsl(186 100% 50% / 0.45))`,
            transition: 'background 0.3s ease-out',
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'hsl(200 40% 12% / 0.92)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid hsl(186 60% 50% / 0.10)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: `radial-gradient(400px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(186 100% 50% / 0.07), transparent 60%)`,
            }}
          />

          {/* Header */}
          <div className="relative z-10 pt-10 pb-4 px-8 text-center">
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                transform: `translateX(${tilt.y * 2}px) translateY(${tilt.x * 2}px) translateZ(30px)`,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 32px hsl(186 100% 50% / 0.25)',
              }}
            >
              <Wallet className="w-7 h-7" style={{ color: 'hsl(200 45% 8%)' }} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-white mb-1"
              style={{
                transform: `translateX(${tilt.y * 0.5}px) translateY(${tilt.x * 0.5}px)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              MiCartera — Control financiero inteligente
            </h1>
            <p className="text-sm text-white/40">
              {view === 'forgot' ? 'Recupera tu acceso' : 'Control financiero inteligente'}
            </p>
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 pb-8">

            {/* ===== VISTA RECUPERAR CONTRASEÑA ===== */}
            {view === 'forgot' ? (
              <div className="space-y-4">
                {forgotSent ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="text-4xl">📬</div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Te hemos enviado un enlace a <span className="text-white font-medium">{forgotEmail}</span>. Revisa tu bandeja de entrada.
                    </p>
                    <button
                      onClick={() => { setView('auth'); setForgotSent(false); setForgotEmail(''); }}
                      className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-white/50 text-sm">
                      Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="text-xs font-medium text-white/50 uppercase tracking-wider">
                          Email
                        </Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-12 rounded-xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-primary/30 transition-all"
                          style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                          autoComplete="email"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-sm font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                          boxShadow: '0 4px 24px hsl(186 100% 50% / 0.20)',
                          color: 'hsl(200 45% 8%)',
                        }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar enlace'}
                      </Button>
                    </form>
                    <button
                      onClick={() => setView('auth')}
                      className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" /> Volver
                    </button>
                  </>
                )}
              </div>
            ) : (

            /* ===== VISTA LOGIN / REGISTRO ===== */
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/5 rounded-xl h-11">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 transition-all"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 transition-all"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-medium text-white/50 uppercase tracking-wider">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-primary/30 transition-all"
                      style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-xs font-medium text-white/50 uppercase tracking-wider">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-primary/30 transition-all"
                      style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {/* Enlace recuperar contraseña */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-semibold group relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                      boxShadow: '0 4px 24px hsl(186 100% 50% / 0.20)',
                      color: 'hsl(200 45% 8%)',
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-xs font-medium text-white/50 uppercase tracking-wider">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-primary/30 transition-all"
                      style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-xs font-medium text-white/50 uppercase tracking-wider">Contraseña</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl text-white placeholder:text-white/25 focus:ring-2 focus:ring-primary/30 transition-all"
                      style={{ background: "hsl(200 35% 16%)", border: "1px solid hsl(186 60% 50% / 0.12)" }}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-semibold group relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                      boxShadow: '0 4px 24px hsl(186 100% 50% / 0.20)',
                      color: 'hsl(200 45% 8%)',
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Crear Cuenta
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </div>
      </div>

      <p className="absolute bottom-6 text-[11px] text-white/15 tracking-widest uppercase font-medium">
        MiCartera · v3.0
      </p>
    </main>
  );
}