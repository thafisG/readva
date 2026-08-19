import type { MokaMood } from '../../features/moka/moka.component';

export interface Mission {
  id: string;
  matIcon: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  matIcon: string;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
  mokaMood: MokaMood;
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
}
