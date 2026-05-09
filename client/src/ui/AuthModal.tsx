// ============================================================
//  ui/AuthModal.tsx
//  Modal de Login / Registro integrado ao Firebase Auth
// ============================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerWithEmail, loginWithEmail, loginWithGoogle } from '../firebase/auth';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type AuthTab = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
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
        if (!displayName.trim()) { setError('Digite seu nome de jogador.'); setLoading(false); return; }
        await registerWithEmail(email, password, displayName.trim());
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
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
      onSuccess();
    } catch (err: any) {
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center"
      >
        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm mx-4 bg-[#0d1117] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Glow top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

          {/* Header */}
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-black text-white tracking-widest uppercase">
                {tab === 'login' ? '⚔️ Entrar' : '🛡️ Criar Conta'}
              </h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-500 text-xs tracking-widest uppercase">
              {tab === 'login' ? 'Acesse sua conta Hexum' : 'Junte-se ao campo de batalha'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-5 bg-black/40 rounded-xl p-1 gap-1">
            {(['login', 'register'] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearError(); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                  tab === t
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'login' ? 'Login' : 'Registro'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="px-6 pb-6 space-y-3">
            {tab === 'register' && (
              <input
                type="text"
                placeholder="Nome de jogador"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
              />
            )}
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
            />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs font-semibold px-1"
                >
                  ⚠️ {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-[0.98]"
            >
              {loading ? '⏳ Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-600 text-xs uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-50 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {/* Google SVG icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
