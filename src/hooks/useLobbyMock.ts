import { useMemo, useState } from 'react';
import type { Player } from '@/types/lobby';

type UseLobbyMockResult = {
  players: (Player | null)[];
  currentUserReady: boolean;

  toggleReady: () => void;
};

const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'RICK_C_137',
    avatar: 'https://picsum.photos/seed/rick/200/200',
    isReady: true,
    isHost: true,
  },
  {
    id: '2',
    name: 'MORTY_C_137',
    avatar: 'https://picsum.photos/seed/morty/200/200',
    isReady: true,
    isHost: false,
  },
  {
    id: '3',
    name: 'BIRDPERSON',
    avatar: 'https://picsum.photos/seed/birdperson/200/200',
    isReady: true,
    isHost: false,
  },
];

export function useLobbyMock(): UseLobbyMockResult {
  const initialPlayers = useMemo<(Player | null)[]>(() => [...MOCK_PLAYERS, null, null, null], []);

  const [players, setPlayers] = useState<(Player | null)[]>(initialPlayers);
  const [currentUserReady, setCurrentUserReady] = useState(false);

  const toggleReady = () => {
    // Mock otimista (assumindo host como usuário atual)
    setCurrentUserReady(prev => !prev);
    setPlayers(prev => {
      const next = [...prev];
      if (next[0]) next[0] = { ...next[0], isReady: !next[0].isReady };
      return next;
    });
  };

  return {
    players,
    currentUserReady,
    toggleReady,
  };
}
