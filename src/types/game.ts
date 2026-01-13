export interface IPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  hp: number;
  maxHp: number;
  shields: number;
  goldShields: number;
  isDead: boolean;
  inventory: IItem[];
}
export interface IItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}
export interface IPill {
  id: string;
  type: 'SAFE' | 'POISON' | 'TOXIC' | 'ANTIDOTE' | 'LETHAL' | 'UNKNOWN';
  revealed: boolean;
}
export interface IGameState {
  round: number;
  currentTurnPlayerId: string;
  players: IPlayer[];
  pillPool: { safe: number; poison: number; toxic: number; antidote: number; lethal: number };
  tablePills: IPill[];
  gameLog: string[];
}
