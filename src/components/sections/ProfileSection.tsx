import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, Lock, User as UserIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface ProfileSectionProps {
  onBack: () => void;
}

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres').max(72, 'Máximo 72 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const ProfileSection = ({ onBack }: ProfileSectionProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url, display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error cargando perfil:', error);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        // ✅ Leer display_name de profiles primero, luego fallback al email
        const name = (data as any)?.display_name || user.email?.split('@')[0] || '';
        setDisplayName(name);
      });
  }, [user]);

  const initials = (displayName || user?.email || 'U')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Solo JPG, PNG, WEBP o GIF'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      setAvatarUrl(url);
      toast.success('Foto actualizada');
    } catch (err: any) {
      toast.error('Error al subir la imagen: ' + (err.message || ''));
    }
    finally { setUploadingAvatar(false); e.target.value = ''; }
  };

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 60) {
      toast.error('El nombre debe tener entre 1 y 60 caracteres');
      return;
    }
    setSavingName(true);
    try {
      // ✅ upsert en lugar de update — funciona aunque display_name sea null
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: user.id, display_name: trimmed },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      toast.success('Nombre actualizado');
    } catch (err: any) {
      toast.error('No se pudo guardar el nombre: ' + (err.message || ''));
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const parsed = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!currentPassword) {
      toast.error('Introduce tu contraseña actual');
      return;
    }
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error('La contraseña actual no es correcta');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Contraseña actualizada');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl h-10 w-10 p-0" aria-label="Volver">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
          <p className="text-sm text-muted-foreground">Tu información personal</p>
        </div>
      </div>

      {/* Avatar + Nombre */}
      <div className="rounded-3xl p-6 space-y-6" style={{
        background: 'hsl(200 40% 12% / 0.92)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid hsl(186 60% 50% / 0.12)',
        boxShadow: '0 20px 60px -20px hsl(200 45% 4% / 0.7)',
      }}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20 rounded-2xl">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="rounded-2xl text-xl font-bold text-primary-foreground"
                style={{ background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                boxShadow: '0 8px 24px hsl(186 100% 50% / 0.35)',
              }}
              aria-label="Cambiar foto"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <button onClick={() => avatarInputRef.current?.click()} className="text-xs font-medium mt-1"
              style={{ color: 'hsl(186 100% 70%)' }}>
              Cambiar foto
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display-name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Nombre / Alias
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Tu nombre"
                maxLength={60}
                className="pl-10 h-11 rounded-xl text-sm font-medium"
                style={{
                  background: 'hsl(200 35% 16%)',
                  border: '1px solid hsl(186 60% 50% / 0.12)',
                  color: 'white',
                }}
              />
            </div>
            <Button onClick={handleSaveName} disabled={savingName} className="rounded-xl h-11 px-4 font-semibold"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                color: 'white',
              }}>
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-3xl p-6 space-y-4" style={{
        background: 'hsl(200 40% 12% / 0.92)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid hsl(186 60% 50% / 0.12)',
        boxShadow: '0 20px 60px -20px hsl(200 45% 4% / 0.7)',
      }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
              boxShadow: '0 8px 24px hsl(186 100% 50% / 0.25)',
            }}>
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Cambiar contraseña</h2>
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 'current-pass', label: 'Contraseña actual', value: currentPassword, onChange: setCurrentPassword, autoComplete: 'current-password' },
            { id: 'new-pass', label: 'Nueva contraseña', value: newPassword, onChange: setNewPassword, autoComplete: 'new-password' },
            { id: 'confirm-pass', label: 'Confirmar nueva contraseña', value: confirmPassword, onChange: setConfirmPassword, autoComplete: 'new-password' },
          ].map(({ id, label, value, onChange, autoComplete }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
              <Input
                id={id}
                type="password"
                autoComplete={autoComplete}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 rounded-xl text-sm"
                style={{
                  background: 'hsl(200 35% 16%)',
                  border: '1px solid hsl(186 60% 50% / 0.12)',
                  color: 'white',
                }}
              />
            </div>
          ))}
          <Button onClick={handleChangePassword} disabled={savingPassword}
            className="w-full rounded-xl h-11 font-semibold mt-2"
            style={{
              background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
              color: 'white',
              boxShadow: '0 8px 24px hsl(186 100% 50% / 0.25)',
            }}>
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar contraseña
          </Button>
        </div>
      </div>
    </div>
  );
};