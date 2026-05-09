// ============================================================
//  ui/LoginPage.tsx
//  Página de login/registro — exibida antes do MainMenu
//  Requer autenticação para acessar o jogo
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerWithEmail, loginWithEmail, loginWithGoogle } from '../firebase/auth';
import backgroundImg from '../assets/background.jpg';
import heroImg from '../assets/hexum.png';

type AuthTab = 'login' | 'register';

interface LoginPageProps {
  onAuthenticated: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = () => setError('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'register') {
        if (!displayName.trim()) {
          setError('Digite seu nome de jogador.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName.trim());
      } else {
        await loginWithEmail(email, password);
      }
      onAuthenticated();
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/weak-password': 'Senha fraca — mínimo 6 caracteres.',
        'auth/user-not-found': 'Conta não encontrada.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
      };
      setError(msg[err.code] ?? 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onAuthenticated();
    } catch {
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />

      {/* Animated ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-700/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-x-0 -top-8 -bottom-8 bg-amber-500/10 blur-[60px] rounded-full" />
          <img
            src={heroImg}
            alt="HEXUM"
            className="relative w-56 md:w-72 h-auto object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="w-full bg-[#0a0d12]/90 border border-white/8 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="px-7 pt-6 pb-7">
            {/* Header */}
            <div className="mb-5 text-center">
              <h1 className="text-lg font-black text-white tracking-[0.2em] uppercase">
                {tab === 'login' ? 'Entre na Batalha' : 'Junte-se ao Combate'}
              </h1>
              <p className="text-slate-500 text-xs tracking-widest mt-1 uppercase">
                {tab === 'login' ? 'Acesse sua conta para continuar' : 'Crie sua conta de guerreiro'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-black/40 rounded-xl p-1 gap-1 mb-5">
              {(['login', 'register'] as AuthTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); clearError(); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                    tab === t
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'login' ? '⚔️ Login' : '🛡️ Registro'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <AnimatePresence mode="wait">
                {tab === 'register' && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="text"
                      placeholder="Nome de jogador"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-red-400 text-xs font-semibold px-1 flex items-center gap-1.5"
                  >
                    <span>⚠️</span> {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.45)] transition-all duration-200 active:scale-[0.98]"
              >
                {loading
                  ? '⏳ Aguarde...'
                  : tab === 'login' ? '⚔️ Entrar na Batalha' : '🛡️ Criar Conta'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-slate-600 text-xs uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-50 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] text-slate-400 uppercase tracking-[0.2em]"
        >
          © 2026 Hexum Studios
        </motion.p>
      </motion.div>
    </div>
  );
};
