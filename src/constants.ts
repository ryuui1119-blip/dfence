export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const ROCKET_SPEED_MIN = 0.001;
export const ROCKET_SPEED_MAX = 0.0025;
export const MISSILE_SPEED = 0.02;

export const EXPLOSION_MAX_RADIUS = 40;
export const EXPLOSION_DURATION = 1000; // ms

export const WIN_SCORE = 5000;
export const POINTS_PER_ROCKET = 20;
export const POINTS_PER_MISSILE = 5;

export const WAVE_ROCKETS_BASE = 10;
export const WAVE_ROCKETS_INCREMENT = 5;

export const INITIAL_TURRETS = [
  { id: 't1', x: 50, y: 550, missiles: 30, maxMissiles: 30, destroyed: false },
  { id: 't2', x: 750, y: 550, missiles: 30, maxMissiles: 30, destroyed: false },
];

export const INITIAL_CITIES = [
  { id: 'c1', x: 200, y: 570, destroyed: false },
  { id: 'c2', x: 300, y: 570, destroyed: false },
  { id: 'c3', x: 400, y: 570, destroyed: false },
  { id: 'c4', x: 500, y: 570, destroyed: false },
  { id: 'c5', x: 600, y: 570, destroyed: false },
];

export const I18N = {
  en: {
    title: "Tina Nova Defense",
    start: "Start Game",
    win: "Mission Accomplished!",
    loss: "Defense Failed",
    score: "Score",
    missiles: "Missiles",
    playAgain: "Play Again",
    instructions: "Click anywhere to intercept falling rockets. Protect your cities!",
  },
  zh: {
    title: "Tina新星防御",
    start: "开始游戏",
    win: "任务成功！",
    loss: "防御失败",
    score: "得分",
    missiles: "导弹",
    playAgain: "再玩一次",
    instructions: "点击屏幕发射拦截导弹。保护你的城市！",
  }
};
