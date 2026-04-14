import React from 'react';
import { useGameStore } from '../store/gameStore';
import heroImg from '../assets/hexum.png';
import backgroundImg from '../assets/background.jpg';

export const MainMenu: React.FC = () => {
  const { setCurrentView, aiDifficulty, setAiDifficulty } = useGameStore();

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-transparent overflow-hidden font-[Inter]"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Epic background wrapper (Adaptado para o novo BG global) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/50" />

        {/* Animated dust/stars pseudo particles */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjgpIi8+Cjwvc3ZnPg==')] transition-transform duration-[60s] ease-linear hover:scale-110" />
      </div>

      <div className="flex flex-col items-center z-10 space-y-12 w-full max-w-4xl px-4">

        {/* Central Hero Art (Crown) - Agora o Título Visual Absoluto */}
        <div className="relative group perspective-1000">
          <div className="absolute inset-x-0 -top-10 -bottom-10 bg-amber-500/10 blur-[100px] rounded-full scale-110 group-hover:scale-125 transition-transform duration-1000 opacity-40" />
          <div className="relative transition-all duration-700 hover:drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <img
              src={heroImg}
              alt="HEXUM Crown"
              className="w-[550px] md:w-[650px] h-auto rounded-3xl object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </div>

        {/* Buttons Menu */}
        <div className="flex flex-col w-full max-w-[550px] md:max-w-[650px] space-y-5">

          <button
            onClick={() => setCurrentView('PLAY')}
            className="group relative w-full flex items-center justify-center py-5 px-6 bg-gradient-to-r from-blue-900/60 via-indigo-800/60 to-blue-900/60 hover:from-blue-700/80 hover:via-indigo-600/80 hover:to-blue-700/80 border border-blue-500/30 hover:border-blue-400 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="flex items-center gap-4">
              <span className="text-3xl filter drop-shadow-md">⚔️</span>
              <div className="text-left">
                <h2 className="text-2xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-md">
                  Iniciar Batalha
                </h2>
                <p className="text-blue-200/60 text-xs font-semibold uppercase tracking-widest">
                  {aiDifficulty === 'DEUS' ? 'PROJETO DEUS EX: ONIPRESENÇA TÁTICA' :
                   aiDifficulty === 'GRANDMASTER' ? 'Desafio Divino: IA Grão-Mestre' : 
                   aiDifficulty === 'ELITE' ? 'Desafio Extremo: IA de Elite' : 'Modo Casual: IA Iniciante'}
                </p>
              </div>
            </div>
          </button>

          {/* Difficulty Selector */}
          <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl w-full gap-1">
            <button
              onClick={() => setAiDifficulty('BEGINNER')}
              className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                aiDifficulty === 'BEGINNER' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🔰</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">Iniciante</span>
            </button>
            <button
              onClick={() => setAiDifficulty('ELITE')}
              className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                aiDifficulty === 'ELITE' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🔥</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">Elite</span>
            </button>
            <button
              onClick={() => setAiDifficulty('GRANDMASTER')}
              className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                aiDifficulty === 'GRANDMASTER' 
                  ? 'bg-purple-500/30 text-amber-400 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-sm">👑</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">Mestre</span>
            </button>
            <button
              onClick={() => setAiDifficulty('DEUS')}
              className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group/deus ${
                aiDifficulty === 'DEUS' 
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]' 
                  : 'text-slate-600 hover:text-cyan-400'
              }`}
            >
              {aiDifficulty === 'DEUS' && (
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent animate-pulse" />
              )}
              <span className={`text-sm ${aiDifficulty === 'DEUS' ? 'animate-bounce' : ''}`}>👁️</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">DEUS</span>
            </button>
          </div>

          <button
            onClick={() => setCurrentView('SANDBOX')}
            className="group relative w-full flex items-center justify-center py-5 px-6 bg-gradient-to-r from-slate-900/80 via-zinc-800/80 to-slate-900/80 hover:from-slate-700/80 hover:via-zinc-600/80 hover:to-slate-700/80 border border-slate-600/30 hover:border-slate-400 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="flex items-center gap-4">
              <span className="text-3xl filter drop-shadow-md opacity-80 group-hover:opacity-100">🛠️</span>
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-300 group-hover:text-white tracking-widest uppercase shadow-black drop-shadow-md transition-colors">
                  Simulador de Guerra
                </h2>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                  Campo de Adestramento & Provas
                </p>
              </div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="flex flex-col items-center space-y-2 opacity-40 hover:opacity-100 transition-opacity pt-4">
          <button
            onClick={() => window.open('https://forms.gle/c9ReRbd2SAc5dggr7', '_blank')}
            className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase hover:text-blue-300 transition-colors cursor-pointer pointer-events-auto"
          >
            Enviar Feedback 📩
          </button>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
            © 2026 Hexum Studios
          </p>
        </div>

      </div>
    </div>
  );
};
