import React from 'react';
import { useGameStore } from '../store/gameStore';
import { UNIT_STATS, ARTIFACTS, SPELLS } from 'shared';
import reiIcon from '../assets/rei.png';
import arqueiroIcon from '../assets/arqueiro.png';
import assassinoIcon from '../assets/assassino.png';
import cavaleiroIcon from '../assets/cavaleiro.png';
import clerigoIcon from '../assets/clerigo.png';
import lanceiroIcon from '../assets/lanceiro.png';
import magoIcon from '../assets/mago.png';
import escudoIcon from '../assets/escudo.png';

function getCardDetails(cardId: string) {
  if (cardId.startsWith('unit_')) {
    const unitClass = cardId.replace('unit_', '');
    const capitalized = unitClass.charAt(0).toUpperCase() + unitClass.slice(1);
    const stats = UNIT_STATS[capitalized];
    const icons: Record<string, string> = { 
      Rei: reiIcon, 
      Cavaleiro: cavaleiroIcon, 
      Lanceiro: lanceiroIcon, 
      Arqueiro: arqueiroIcon, 
      Assassino: assassinoIcon, 
      Mago: magoIcon, 
      Clerigo: clerigoIcon 
    };
    return { id: cardId, class: capitalized, icon: icons[capitalized] || '👤', cost: stats.mana, atk: stats.attack, hp: stats.hp, type: 'Unidade' };
  }
  const art = ARTIFACTS.find(a => a.id === cardId);
  if (art) {
    const icon = cardId === 'art_escudo' ? escudoIcon : '⚔️';
    return { id: cardId, class: art.name, icon, cost: art.manaCost, atk: '-', hp: '-', type: 'Artefato' };
  }
  const spl = SPELLS.find(s => s.id === cardId);
  if (spl) return { id: cardId, class: spl.name, icon: '✨', cost: spl.manaCost, atk: '-', hp: '-', type: 'Mágica' };
  return null;
}

export const HandUI: React.FC = () => {
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const players = useGameStore(state => state.players);
  const selectedCard = useGameStore(state => state.selectedCard);
  const setSelectedCard = useGameStore(state => state.setSelectedCard);
  const setSelectedHex = useGameStore(state => state.setSelectedHex);
  const offerCard = useGameStore(state => state.offerCard);
  const isAiThinking = useGameStore(state => state.isAiThinking);
  
  // SEMPRE mostra a mão do P1 (jogador humano)
  const humanPlayer = players['p1'];
  const isMyTurn = currentTurnPlayerId === 'p1';

  return (
    <div className="relative flex flex-col items-center">
      
      {selectedCard && humanPlayer.canOfferCard && isMyTurn && (
        <button 
          onClick={() => {
            offerCard(selectedCard);
            setSelectedCard(null);
          }}
          className="mb-2 bg-yellow-600 hover:bg-yellow-500 text-white font-black text-xs px-4 py-1.5 rounded-full border-2 border-yellow-300 shadow-[0_0_12px_rgba(202,138,4,0.5)] transition-all animate-bounce"
        >
          🔥 SACRIFICAR POR MANA (+1)
        </button>
      )}

      <div className={`flex gap-2 transition-all duration-300 ${!isMyTurn ? 'opacity-40 pointer-events-none scale-95' : ''}`}>
        {humanPlayer.hand.map((cardId, idx) => {
          const card = getCardDetails(cardId);
          if (!card) return null;
          const canAfford = isMyTurn && humanPlayer.mana >= card.cost;
          const isSelected = selectedCard === card.id;
          
          return (
            <div 
              key={`${cardId}-${idx}`} 
              onClick={() => {
                if (!canAfford || !isMyTurn) return;
                setSelectedCard(isSelected ? null : card.id);
                setSelectedHex(null);
              }}
              className={`
                relative w-20 h-28 md:w-24 md:h-32 rounded-xl border-2 flex flex-col items-center p-1 md:p-1.5 text-center
                transition-all duration-200 cursor-pointer shadow-xl
                ${isSelected 
                  ? 'bg-[#0b622f]/40 border-yellow-400 -translate-y-4 shadow-[0_12px_25px_rgba(250,204,21,0.3)]'
                  : canAfford 
                    ? 'bg-slate-800/90 border-slate-600 hover:-translate-y-3 hover:border-[#0b622f] hover:shadow-[#0b622f]/30' 
                    : 'bg-slate-900 border-slate-800 opacity-50 grayscale'
                }
              `}
            >
              {/* Custo de mana (Movido para a direita) */}
              <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border flex items-center justify-center font-black text-[10px] text-white shadow-md z-10 ${
                canAfford ? 'bg-[#0b622f] border-[#0b622f]/50' : 'bg-slate-700 border-slate-500'
              }`}>
                {card.cost}
              </div>
              
              <div className="text-lg md:text-xl mt-1 flex items-center justify-center h-8">
                {(card.icon.includes('/') || card.icon.includes('.') || card.icon.startsWith('data:')) ? (
                  <img src={card.icon} alt={card.class} className="w-6 h-6 object-contain drop-shadow-md" />
                ) : (
                  card.icon
                )}
              </div>
              <h4 className="text-white font-bold text-[8px] md:text-[9px] mt-0.5 line-clamp-1 leading-tight">{card.class}</h4>
              
              {/* Badge de tipo */}
              <div className={`mt-auto mb-4 px-1 py-0.5 rounded-full text-[6px] md:text-[7px] font-black uppercase tracking-tighter ${
                card.type === 'Unidade' ? 'bg-[#0b622f]/80 text-[#a7f3d0]' :
                card.type === 'Artefato' ? 'bg-amber-600/80 text-amber-100' :
                'bg-[#602471]/80 text-[#f5d0f9]'
              }`}>
                {card.type}
              </div>

              {/* Stats Badge Padronizada */}
              <div className={`absolute -bottom-2 flex gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-600 shadow-lg text-[8px] md:text-[9px] font-black z-20 ${!canAfford ? 'opacity-50' : ''}`}>
                <span className="text-yellow-400">⚔{card.atk}</span>
                <span className="text-slate-600">|</span>
                <span className="text-green-400">♥{card.hp}</span>
              </div>

              {!canAfford && isMyTurn && (
                <div className="absolute inset-0 bg-red-900/30 backdrop-blur-[0.5px] rounded-xl flex items-center justify-center font-black text-[10px] text-red-400 -rotate-12 pointer-events-none">
                  MANA
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isMyTurn && (
        <div className="mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">
          {isAiThinking ? 'Oponente está pensando...' : 'Aguardando seu turno...'}
        </div>
      )}
    </div>
  );
};
