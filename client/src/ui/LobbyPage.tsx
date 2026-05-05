// ============================================================
//  ui/LobbyPage.tsx
//  Tela de sala PvP: criar sala (host) ou entrar por código (guest)
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import { createLobby, joinLobbyByCode, subscribeToLobby } from '../firebase/firestore';
import { createInitialState } from 'shared';
import backgroundImg from '../assets/background.jpg';

type LobbyTab = 'create' | 'join';

export const LobbyPage: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentView, setLobbySession, clearLobbySession } = useGameStore();

  const [tab, setTab]           = useState<LobbyTab>('create');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Estado depois de criar a sala (aguardando adversário)
  const [waitingLobbyId, setWaitingLobbyId] = useState<string | null>(null);
  const [roomCode, setRoomCode]             = useState('');

  const displayName = user?.displayName ?? user?.email ?? 'Jogador';

  // ── Criar sala (host = p1) ─────────────────────────────────
  const handleCreate = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      const initialState = createInitialState();
      const lobbyId = await createLobby(user.uid, displayName, initialState);

      // Busca o código do documento recém criado via snapshot
      const unsub = subscribeToLobby(lobbyId, (lobby) => {
        setRoomCode(lobby.code);
        unsub();
      });

      setWaitingLobbyId(lobbyId);
      setLobbySession(lobbyId, 'p1');
    } catch {
      setError('Erro ao criar sala. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Escuta se o guest entrou na sala ──────────────────────
  useEffect(() => {
    if (!waitingLobbyId) return;

    const unsub = subscribeToLobby(waitingLobbyId, (lobby) => {
      if (lobby.status === 'in_progress' && lobby.guestId) {
        // Adversário entrou → setLobbySession já foi chamado no handleCreate
        // Só muda a view (isPvP já é true)
        unsub();
        setCurrentView('PVP');
      }
    });

    return () => unsub();
  }, [waitingLobbyId, setCurrentView]);

  // ── Entrar em sala (guest = p2) ────────────────────────────
  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const result = await joinLobbyByCode(joinCode.trim(), user.uid, displayName);
      if (!result) {
        setError('Sala não encontrada ou já em andamento.');
        return;
      }
      // setLobbySession ANTES de setCurrentView para isPvP=true ao renderizar
      setLobbySession(result.lobbyId, 'p2');
      setCurrentView('PVP');
    } catch {
      setError('Erro ao entrar na sala. Verifique o código.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearLobbySession();
    setCurrentView('MENU');
  };

  // ── Tela de espera (host aguardando guest) ─────────────────
  if (waitingLobbyId) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 bg-black/65" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm mx-4 text-center"
        >
          <div className="bg-[#0a0d12]/90 border border-white/8 rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent mb-6 -mt-8 mx-0 absolute top-0 left-0 right-0 rounded-t-2xl" />

            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-t-indigo-400 rounded-full animate-spin" />
                <div className="absolute inset-2 border border-t-indigo-300/40 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              </div>
            </div>

            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Aguardando adversário</p>

            {/* Código da sala */}
            <div className="bg-black/50 border border-indigo-500/30 rounded-xl px-6 py-4 mb-6">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Código da sala</p>
              <p className="text-3xl font-black text-white tracking-[0.4em]">{roomCode || '...'}</p>
            </div>

            <p className="text-slate-600 text-xs mb-6">
              Envie esse código para o seu amigo. A partida começa automaticamente quando ele entrar.
            </p>

            <button
              onClick={() => { if (roomCode) navigator.clipboard.writeText(roomCode); }}
              className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-bold tracking-widest uppercase transition-all mb-3"
            >
              📋 Copiar código
            </button>

            <button
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Cancelar e voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Tela principal (criar / entrar) ───────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover' }}
    >
      <div className="absolute inset-0 bg-black/65" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Menu
        </button>

        <div className="bg-[#0a0d12]/90 border border-white/8 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="px-7 pt-6 pb-7">
            <h1 className="text-white font-black text-lg tracking-wide mb-1">⚔️ Jogar contra Amigo</h1>
            <p className="text-slate-500 text-xs mb-5">PvP em tempo real via sala privada</p>

            {/* Tabs */}
            <div className="flex bg-black/40 rounded-xl p-1 gap-1 mb-5">
              {(['create', 'join'] as LobbyTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    tab === t
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'create' ? '🏰 Criar Sala' : '🚪 Entrar'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'create' ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                    Crie uma sala privada e envie o código gerado para o seu amigo.
                    A partida começa automaticamente quando ele entrar.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
                  >
                    {loading ? '⏳ Criando sala...' : '🏰 Criar Sala'}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Digite o código da sala"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-black text-white placeholder-slate-600 tracking-[0.3em] focus:outline-none focus:border-indigo-500/50 transition-all uppercase"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={loading || joinCode.length < 6}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
                  >
                    {loading ? '⏳ Entrando...' : '🚪 Entrar na Sala'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs mt-3 flex items-center gap-1.5"
                >
                  <span>⚠️</span> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
