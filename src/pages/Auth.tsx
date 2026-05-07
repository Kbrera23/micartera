import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

// Generate floating orbs data once
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
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const orbs = useMemo(generateOrbs, []);

  // Mouse parallax state
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const dx = (mx - 0.5) * 2; // -1 to 1
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: 'hsl(222, 47%, 5%)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(158 64% 48% / 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(158 64% 48% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: `translate(${(mouse.x - 0.5) * -10}px, ${(mouse.y - 0.5) * -10}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Floating orbs that react to mouse */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="pointer-events-none absolute rounded-full blur-3xl animate-pulse-glow"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, hsl(${orb.hue} 70% 50% / 0.12), transparent 70%)`,
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
          background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(158 64% 48% / 0.08), transparent 50%),
                       radial-gradient(300px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(158 64% 48% / 0.04), transparent 60%)`,
          transition: 'background 0.15s ease-out',
        }}
      />

      {/* Card with 3D tilt */}
      <div
        className="relative z-10 w-full max-w-[420px] mx-4"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card glow border */}
        <div
          className="absolute -inset-[1px] rounded-3xl opacity-60"
          style={{
            background: `conic-gradient(from ${mouse.x * 360}deg at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(158 64% 48% / 0.3), transparent 40%, hsl(234 89% 60% / 0.2), transparent 70%, hsl(158 64% 48% / 0.3))`,
            transition: 'background 0.3s ease-out',
          }}
        />

        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'hsl(0 0% 6% / 0.9)', backdropFilter: 'blur(40px)' }}>
          {/* Inner cursor glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: `radial-gradient(400px circle at ${mouse.x * 100}% ${mouse.y * 100}%, hsl(158 64% 48% / 0.05), transparent 60%)`,
            }}
          />

          {/* Header */}
          <div className="relative z-10 pt-10 pb-4 px-8 text-center">
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, hsl(158 64% 48%), hsl(158 64% 38%))',
                transform: `translateX(${tilt.y * 2}px) translateY(${tilt.x * 2}px) translateZ(30px)`,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 32px hsl(158 64% 48% / 0.3)',
              }}
            >
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-white mb-1"
              style={{
                transform: `translateX(${tilt.y * 0.5}px) translateY(${tilt.x * 0.5}px)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              MiCartera
            </h1>
            <p className="text-sm text-white/40">Control financiero inteligente</p>
          </div>

          {/* Form content */}
          <div className="relative z-10 px-8 pb-8">
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
                      className="h-12 rounded-xl bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
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
                      className="h-12 rounded-xl bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-semibold group relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, hsl(158 64% 48%), hsl(158 64% 38%))',
                      boxShadow: '0 4px 24px hsl(158 64% 48% / 0.25)',
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
                      className="h-12 rounded-xl bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
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
                      className="h-12 rounded-xl bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-semibold group relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, hsl(158 64% 48%), hsl(158 64% 38%))',
                      boxShadow: '0 4px 24px hsl(158 64% 48% / 0.25)',
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
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="absolute bottom-6 text-[11px] text-white/15 tracking-widest uppercase font-medium">
        MiCartera · v3.0
      </p>
    </div>
  );
}
