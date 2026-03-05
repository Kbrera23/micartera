import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Wallet } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Mouse parallax state
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);   // -1 to 1
      const dy = (e.clientY - cy) / (rect.height / 2);  // -1 to 1
      setTilt({ x: dy * 10, y: -dx * 10 });
      setGlowPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 });
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
      className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient background blobs that react to mouse */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-300"
        style={{
          background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, hsl(var(--primary) / 0.12), transparent 70%)`,
        }}
      />

      <div
        ref={cardRef}
        style={{
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
        }}
      >
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl relative overflow-hidden">
          {/* Inner glow that follows cursor */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-all duration-300"
            style={{
              background: `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, hsl(var(--primary) / 0.08), transparent 70%)`,
            }}
          />

          <CardHeader className="text-center pb-2 relative z-10">
            <div
              className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
              style={{
                transform: `translateX(${tilt.y * 1.5}px) translateY(${tilt.x * 1.5}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">MiCartera</CardTitle>
            <CardDescription>Gestiona tus finanzas de forma inteligente</CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="tu@email.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-12 text-base" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-12 text-base" autoComplete="current-password" required />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="tu@email.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-12 text-base" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input id="register-password" type="password" placeholder="Mínimo 6 caracteres" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-12 text-base" autoComplete="new-password" required />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
