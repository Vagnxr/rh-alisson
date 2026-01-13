
import { create } from 'zustand';
import { IGameState, IPill } from '@/types/game';

const initialState: IGameState = {
  round: 1,
  currentTurnPlayerId: 'player-1',
  players: [
    {
      id: 'player-1',
      name: 'Rick Sanchez',
      avatarUrl: '/images/avatar/rick_sanchez.png',
      hp: 3,
      maxHp: 3,
      shields: 3,
      goldShields: 1,
      isDead: false,
      inventory: [],
    },
    {
      id: 'p2',
      name: 'Birdperson',
      avatarUrl: '/images/avatar/birdperson_md.png',
      hp: 2,
      maxHp: 3,
      shields: 2,
      goldShields: 1,
      isDead: false,
      inventory: [],
    },
    {
      id: 'p3',
      name: 'Cromulon',
      avatarUrl: '/images/avatar/cromolum_md.png',
      hp: 1,
      maxHp: 3,
      shields: 2,
      goldShields: 0,
      isDead: false,
      inventory: [],
    },
    {
      id: 'p4',
      name: 'Squanchy',
      avatarUrl: '/images/avatar/squanchy_md.png',
      hp: 2,
      maxHp: 3,
      shields: 0,
      goldShields: 0,
      isDead: false,
      inventory: [],
    },
  ],
  pillPool: { safe: 6, poison: 4, toxic: 2, antidote: 1, lethal: 0 },
  tablePills: [],
  gameLog: ['> System initialized...'],
};

interface GameActions {
  addLog: (msg: string) => void;
  initMatch: () => void;
  choosePill: (id: string, type: IPill['type']) => void;
  reset: () => void;
}

export const useGameStore = create<IGameState & GameActions>((set) => ({
  ...initialState,

  addLog: msg => set(state => ({ gameLog: [...state.gameLog, msg] })),

  initMatch: () => {
    // Gerador mock de pool inicial
    const newPool: IPill[] = [
      { id: '101', type: 'SAFE', revealed: false },
      { id: '102', type: 'SAFE', revealed: false },
      { id: '103', type: 'POISON', revealed: false },
      { id: '104', type: 'SAFE', revealed: false },
      { id: '105', type: 'TOXIC', revealed: false },
      { id: '106', type: 'SAFE', revealed: false },
      { id: '107', type: 'POISON', revealed: false },
      { id: '108', type: 'SAFE', revealed: false },
      { id: '109', type: 'ANTIDOTE', revealed: false },
      { id: '110', type: 'LETHAL', revealed: false },
      { id: '111', type: 'SAFE', revealed: false },
      { id: '112', type: 'POISON', revealed: false },
    ];
    set({ tablePills: newPool, round: 1, gameLog: ['> Match Started.', '> Generated Pill Pool.'] });
  },

  choosePill: (id, type) => {
    set(state => ({
      tablePills: state.tablePills.filter(p => p.id !== id),
      gameLog: [...state.gameLog, `> Player consumed ${type}.`]
    }));
  },

  reset: () => set(initialState)
}));
