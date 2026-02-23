export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface Rocket extends Entity {
  targetX: number;
  targetY: number;
  speed: number;
  progress: number; // 0 to 1
}

export interface Missile extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  progress: number; // 0 to 1
  exploded: boolean;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
}

export interface Turret extends Entity {
  missiles: number;
  maxMissiles: number;
  destroyed: boolean;
}

export interface City extends Entity {
  destroyed: boolean;
}

export interface GameState {
  score: number;
  status: GameStatus;
  rockets: Rocket[];
  missiles: Missile[];
  explosions: Explosion[];
  turrets: Turret[];
  cities: City[];
}
