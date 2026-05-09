import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../firebase/auth';
import heroImg from '../assets/hexum.png';
import backgroundImg from '../assets/background.jpg';

// ── Seletor de dificuldade ─────────────────────────────────
const difficulties = [
  { id: 'BEGINNER',    label: 'Iniciante', icon: '🔰', color: 'emerald' },
  { id: 'ELITE',       label: 'Elite',     icon: '🔥', color: 'red'     },
  { id: 'GRANDMASTER', label: 'Mestre',    icon: '👑', color: 'purple'  },
  { id: 'DEUS',        label: 'Deus',      icon: '👁️', color: 'cyan'    },
] as const;

const diffColors: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20',
  red:     'bg-red-500/15 text-red-400 border-red-500/40 shadow-red-500/20',
  purple:  'bg-purple-500/15 text-amber-400 border-purple-500/40 shadow-purple-500/20',
  cyan:    'bg-cyan-950/60 text-cyan-300 border-cyan-400/70 shadow-cyan-400/25',
};

const diffSubtitles: Record<string, string> = {
  BEGINNER:    'Modo Casual',
  ELITE:       'Desafio Extremo',
  GRANDMASTER: 'Grão-Mestre',
  DEUS:        'Onipresença Tática',
};

// ── Avatar dropdown (estilo Google) ───────────────────────
const UserAvatar: React.FC<{ user: ReturnType<typeof useAuth>['user'] }> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-black text-white text-sm shadow-[0_2px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_0_3px_rgba(245,158,11,0.35)] transition-all duration-200 select-none"
        aria-label="Perfil"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-60 bg-[#111318] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-4 border-b border-white/8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-black text-white text-base flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.displayName ?? 'Jogador'}</p>
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all text-sm font-medium text-left"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                Sair da conta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── MainMenu ───────────────────────────────────────────────
export const MainMenu: React.FC = () => {
  const { setCurrentView, aiDifficulty, setAiDifficulty } = useGameStore();
  const { user } = useAuth();

  const currentDiff = difficulties.find(d => d.id === aiDifficulty) ?? difficulties[0];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-8 py-4">
        <span className="text-white/30 text-xs font-black tracking-[0.35em] uppercase select-none">
          Hexum
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
            className="hidden md:flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs tracking-wider transition-colors"
          >
            <span>📩</span>
            <span>Feedback</span>
          </button>
          <UserAvatar user={user} />
        </div>
      </div>

      {/* ── Main content — two-column on md+, single column on mobile ── */}
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-center gap-0 md:gap-12 lg:gap-20 px-4 md:px-12 lg:px-20 pt-16">

        {/* LEFT — Hero art */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex-shrink-0 flex items-center justify-center w-full md:w-auto"
        >
          <div className="relative group">
            {/* Glow */}
            <div className="absolute inset-0 bg-amber-500/10 blur-[70px] scale-110 rounded-full transition-all duration-1000 group-hover:bg-amber-500/15" />
            <img
              src={heroImg}
              alt="Hexum"
              className="relative w-[220px] sm:w-[280px] md:w-[340px] lg:w-[400px] xl:w-[440px] h-auto object-contain drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
        </motion.div>

        {/* RIGHT — Actions */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
          className="flex flex-col gap-3 w-full max-w-sm md:max-w-[320px] lg:max-w-[360px]"
        >
          {/* Title (mobile only, desktop shows in the art) */}
          <div className="md:hidden text-center mb-1">
            <h1 className="text-white/80 text-xs font-black tracking-[0.4em] uppercase">Campo de Batalha</h1>
          </div>

          {/* Play button */}
          <button
            onClick={() => setCurrentView('PLAY')}
            className="group relative w-full flex items-center gap-4 px-5 py-4 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/25 hover:border-indigo-400/60 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_0_32px_rgba(99,102,241,0.25)] transition-all duration-250 active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-500/5 to-indigo-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl relative z-10">⚔️</span>
            <div className="text-left relative z-10">
              <p className="text-white font-black text-base tracking-wide">Iniciar Batalha</p>
              <p className="text-indigo-300/50 text-[11px] font-medium mt-0.5">
                {diffSubtitles[aiDifficulty]} · {currentDiff.icon} {currentDiff.label}
              </p>
            </div>
          </button>

          {/* Difficulty selector */}
          <div className="grid grid-cols-4 gap-1.5 bg-black/30 border border-white/6 rounded-xl p-1.5 backdrop-blur-sm">
            {difficulties.map(d => {
              const active = aiDifficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setAiDifficulty(d.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border transition-all duration-200 text-[10px] font-black uppercase tracking-tight overflow-hidden ${
                    active
                      ? `${diffColors[d.color]} border shadow-[0_0_12px]`
                      : 'border-transparent text-slate-600 hover:text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {active && d.id === 'DEUS' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/15 to-transparent animate-pulse" />
                  )}
                  <span className={`text-base relative z-10 ${active && d.id === 'DEUS' ? 'animate-bounce' : ''}`}>
                    {d.icon}
                  </span>
                  <span className="relative z-10">{d.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-white/15 text-[10px] tracking-widest uppercase">ou</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Sandbox button */}
          <button
            onClick={() => setCurrentView('SANDBOX')}
            className="group w-full flex items-center gap-4 px-5 py-3.5 bg-slate-900/30 hover:bg-slate-800/50 border border-white/8 hover:border-white/20 rounded-2xl transition-all duration-250 active:scale-[0.98]"
          >
            <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">🛠️</span>
            <div className="text-left">
              <p className="text-slate-300 group-hover:text-white font-bold text-sm transition-colors">Simulador de Guerra</p>
              <p className="text-slate-600 text-[11px] group-hover:text-slate-500 transition-colors">Campo de adestramento & provas</p>
            </div>
          </button>

          {/* PvP button */}
          <button
            onClick={() => setCurrentView('PVP')}
            className="group w-full flex items-center gap-4 px-5 py-3.5 bg-emerald-900/20 hover:bg-emerald-900/35 border border-emerald-700/25 hover:border-emerald-500/50 rounded-2xl transition-all duration-250 active:scale-[0.98]"
          >
            <span className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">👥</span>
            <div className="text-left">
              <p className="text-emerald-300 group-hover:text-emerald-200 font-bold text-sm transition-colors">Jogar contra Amigo</p>
              <p className="text-emerald-800 text-[11px] group-hover:text-emerald-600 transition-colors">Sala privada · PvP em tempo real</p>
            </div>
          </button>

          {/* Mobile feedback link */}
          <div className="md:hidden flex justify-center pt-1">
            <button
              onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5"
            >
              <span>📩</span>
              <span className="tracking-widest uppercase">Enviar Feedback</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom copyright */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <p className="text-white/12 text-[10px] tracking-[0.3em] uppercase">© 2026 Hexum Studios</p>
      </div>
    </div>
  );
};
