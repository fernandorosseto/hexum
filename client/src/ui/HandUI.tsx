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
    return { id: cardId, class: art.name, icon: '', cost: art.manaCost, atk: '-', hp: '-', type: 'Artefato' };
  }
  const spl = SPELLS.find(s => s.id === cardId);
  if (spl) return { id: cardId, class: spl.name, icon: '', cost: spl.manaCost, atk: '-', hp: '-', type: 'Mágica' };
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
  
  const humanPlayer = players['p1'];
  const aiPlayer = players['p2'];
  const isMyTurn = currentTurnPlayerId === 'p1';

  return (
    <div className="relative flex flex-col items-center gap-4">

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
                relative w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center text-center
                transition-all duration-200 cursor-pointer 
                ${isSelected ? '-translate-y-4 scale-110' : canAfford ? 'hover:-translate-y-3' : 'opacity-60 grayscale'}
              `}
            >
              {/* Camada de Fundo (igual ao token) */}
              <div className={`
                absolute inset-0 rounded-full border-[3px] transition-all duration-300
                ${isSelected 
                  ? 'bg-gradient-to-br from-[#0b622f] to-[#063b1c] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' 
                  : canAfford
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-[#0b622f] shadow-lg hover:border-yellow-200 hover:shadow-yellow-400/30'
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-inner'
                }
              `} />

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
              
              {/* Conteúdo Central */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full mt-1">
                <div className="flex items-center justify-center mb-0.5">
                  {card.type === 'Unidade' ? (
                    <img src={card.icon} alt={card.class} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-xl brightness-110" />
                  ) : card.type === 'Mágica' ? (
                    <SpellIcon id={card.id} size={32} className="text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  ) : (
                    <ArtifactIcon id={card.id} size={32} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  )}
                </div>
                <h4 className="text-white font-bold text-[8px] md:text-[9px] line-clamp-1 leading-tight drop-shadow-md">{card.class}</h4>
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

