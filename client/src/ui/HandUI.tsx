import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getUnitCard, ARTIFACTS, SPELLS } from 'shared';
import { CLASS_ICONS } from '../constants/unitIcons';
import { SpellIcon, ArtifactIcon } from '../assets/icons/VectorIcons';

function getCardDetails(cardId: string) {
  if (cardId.startsWith('unit_') || cardId.startsWith('hero_')) {
    try {
      const card = getUnitCard(cardId);
      return { id: cardId, class: card.name, icon: CLASS_ICONS[card.unitClass] || '👤', cost: card.manaCost, atk: card.baseAttack, hp: card.baseHp, type: 'Unidade' };
    } catch(e) { return null; }
  }
  const art = ARTIFACTS.find(a => a.id === cardId);
  if (art) {
    return { id: cardId, class: art.name, icon: '' as any, cost: art.manaCost, atk: '-', hp: '-', type: 'Artefato' };
  }
  const spl = SPELLS.find(s => s.id === cardId);
  if (spl) return { id: cardId, class: spl.name, icon: '' as any, cost: spl.manaCost, atk: '-', hp: '-', type: 'Mágica' };
  return null;
}

export const HandUI: React.FC = () => {
  const currentTurnPlayerId = useGameStore(state => state.currentTurnPlayerId);
  const players = useGameStore(state => state.players);
  const myRole = useGameStore(state => state.myRole);
  const isPvP = useGameStore(state => state.isPvP);
  
  // Em PvP, mostramos sempre a mão do MEU papel. 
  // Em Single Player, mostramos a mão do jogador da vez (p1).
  const targetPlayerId = isPvP ? (myRole || 'p1') : 'p1';
  const player = players[targetPlayerId];
  const hand = player?.hand || [];
  
  const selectedCard = useGameStore(state => state.selectedCard);
  const setSelectedCard = useGameStore(state => state.setSelectedCard);
  const setSelectedHex = useGameStore(state => state.setSelectedHex);
  const offerCard = useGameStore(state => state.offerCard);
  const isAiThinking = useGameStore(state => state.isAiThinking);
  
  const isMyTurn = currentTurnPlayerId === targetPlayerId;

  return (
    <div className="relative flex flex-col md:flex-col items-center gap-4">

      {selectedCard && player?.canOfferCard && isMyTurn && (
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

      <div className={`
        flex flex-row md:flex-row gap-3 md:gap-2 
        overflow-x-auto md:overflow-visible 
        snap-x snap-mandatory md:snap-none
        scrollbar-hide
        px-2 md:px-0
        transition-all duration-300 
        ${!isMyTurn ? 'opacity-40 pointer-events-none scale-95' : ''}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {hand.map((cardId, idx) => {
          const card = getCardDetails(cardId);
          if (!card) return null;
          const canAfford = isMyTurn && player.mana >= card.cost;
          const isSelected = selectedCard === card.id;
          
          return (
            <div 
              key={`${cardId}-${idx}`} 
              onClick={() => {
                if (!isMyTurn) return;
                setSelectedCard(isSelected ? null : card.id);
                setSelectedHex(null);
              }}
              className={`
                relative w-[68px] h-[68px] md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center text-center
                flex-shrink-0 snap-center
                transition-all duration-200 cursor-pointer 
                ${isSelected ? '-translate-y-3 scale-110' : 'hover:scale-105 hover:-translate-y-2'}
                ${!canAfford && !isSelected ? 'opacity-80' : ''}
              `}
            >
              {/* Camada de Fundo (igual ao token) */}
              <div className={`
                absolute inset-0 rounded-full border-[4px] md:border-[6px] transition-all duration-300 overflow-hidden
                ${isSelected 
                  ? 'bg-gradient-to-br from-[#0b622f] to-[#063b1c] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' 
                  : canAfford
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-[#0b622f] shadow-lg hover:border-yellow-200 hover:shadow-yellow-400/30'
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-inner'
                }
              `}>
                {/* Imagem da Unidade em background (para cartas de Unidade) */}
                {card.type === 'Unidade' && card.icon && (
                  <>
                    <img 
                      src={card.icon} 
                      alt={card.class} 
                      className="absolute inset-0 w-full h-full object-cover rounded-full select-none pointer-events-none scale-110 transition-transform duration-200" 
                      style={{
                        filter: canAfford ? 'none' : 'grayscale(0.8) brightness(0.5)',
                        opacity: canAfford ? 1 : 0.6
                      }}
                    />
                    {/* Overlay escuro para garantir legibilidade do texto do título */}
                    <div className="absolute inset-0 bg-black/45 rounded-full z-0 pointer-events-none" />
                  </>
                )}
              </div>

              {/* Aura de Identificação */}
              <div className={`
                absolute inset-[-4px] rounded-full blur-md opacity-40 -z-10
                ${canAfford ? 'bg-[#0b622f]' : 'bg-slate-700 opacity-20'}
              `} />

              {/* Custo de mana */}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-[2px] flex items-center justify-center font-black text-[11px] text-white shadow-md z-20 ${
                canAfford ? 'bg-blue-600 border-blue-300' : 'bg-slate-700 border-slate-500'
              }`}>
                {card.cost}
              </div>
              
              {/* Conteúdo Central (Apenas Nome - Sem desenhos) */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full px-2 mt-0">
                <h4 className="text-white font-black text-[10px] md:text-[12px] leading-snug drop-shadow-md text-center max-w-full break-words">
                  {card.class}
                </h4>
              </div>
              
              {/* Badge de tipo para feitiços e artefatos */}
              {card.type !== 'Unidade' && (
                <div className={`absolute -bottom-2 px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-tighter z-20 border shadow-md ${
                  card.type === 'Artefato' ? 'bg-amber-600/90 text-amber-100 border-amber-400' :
                  'bg-[#602471]/90 text-[#f5d0f9] border-[#d8b4e2]'
                }`}>
                  {card.type}
                </div>
              )}

              {/* Stats Badge Padronizada para Unidades */}
              {card.type === 'Unidade' && (
                <div className={`absolute -bottom-3 flex items-center gap-1.5 font-black text-[10px] md:text-[11px] bg-slate-950 rounded-lg px-2 py-0.5 border-2 shadow-[0_2px_8px_rgba(0,0,0,0.8)] z-20 transition-all ${
                  canAfford ? 'border-[#0b622f]' : 'border-slate-600 opacity-80'
                }`}>
                  <span className="text-yellow-400 drop-shadow-sm">⚔{card.atk}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-green-400 drop-shadow-sm">♥{card.hp}</span>
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

