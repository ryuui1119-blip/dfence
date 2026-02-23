import React, { useEffect, useRef } from 'react';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_DURATION,
  MISSILE_SPEED,
  ROCKET_SPEED_MIN,
  ROCKET_SPEED_MAX,
  POINTS_PER_ROCKET,
  WAVE_ROCKETS_BASE
} from '../constants';
import { GameStatus, Rocket, Missile, Explosion, Turret, City } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  level: number;
  onScoreUpdate: (points: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onWaveComplete: () => void;
  turrets: Turret[];
  cities: City[];
  setTurrets: React.Dispatch<React.SetStateAction<Turret[]>>;
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  level,
  onScoreUpdate,
  onStatusChange,
  onWaveComplete,
  turrets,
  cities,
  setTurrets,
  setCities
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  const rocketsRef = useRef<Rocket[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const starsRef = useRef<{x: number, y: number, size: number, opacity: number}[]>([]);
  
  const spawnTimerRef = useRef<number>(0);
  const rocketsToSpawnRef = useRef<number>(0);
  const waveInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize stars
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT * 0.8,
        size: Math.random() * 2,
        opacity: Math.random()
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    if (status === GameStatus.PLAYING && !waveInProgressRef.current) {
      waveInProgressRef.current = true;
      rocketsToSpawnRef.current = WAVE_ROCKETS_BASE + (level - 1) * 5;
    }
  }, [status, level]);

  const spawnRocket = () => {
    if (rocketsToSpawnRef.current <= 0) return;
    rocketsToSpawnRef.current--;

    const startX = Math.random() * GAME_WIDTH;
    const targets = [...turrets.filter(t => !t.destroyed), ...cities.filter(c => !c.destroyed)];
    if (targets.length === 0) return;
    
    const target = targets[Math.floor(Math.random() * targets.length)];
    const id = Math.random().toString(36).substr(2, 9);
    
    const speedMultiplier = 1 + (level - 1) * 0.2;
    
    rocketsRef.current.push({
      id,
      x: startX,
      y: 0,
      targetX: target.x,
      targetY: target.y,
      speed: (ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN)) * speedMultiplier,
      progress: 0
    });
  };

  const fireMissile = (targetX: number, targetY: number) => {
    if (status !== GameStatus.PLAYING) return;

    let bestTurret: Turret | null = null;
    let minDist = Infinity;

    turrets.forEach(t => {
      if (!t.destroyed && t.missiles > 0) {
        const dist = Math.abs(t.x - targetX);
        if (dist < minDist) {
          minDist = dist;
          bestTurret = t;
        }
      }
    });

    if (bestTurret) {
      const turret = bestTurret as Turret;
      setTurrets(prev => prev.map(t => t.id === turret.id ? { ...t, missiles: t.missiles - 1 } : t));
      
      missilesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        x: turret.x,
        y: turret.y,
        startX: turret.x,
        startY: turret.y,
        targetX,
        targetY,
        speed: MISSILE_SPEED,
        progress: 0,
        exploded: false
      });
    }
  };

  const update = (time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (status === GameStatus.PLAYING) {
      spawnTimerRef.current += deltaTime;
      const spawnInterval = Math.max(500, 2000 - (level - 1) * 200);
      if (spawnTimerRef.current > spawnInterval) {
        spawnRocket();
        spawnTimerRef.current = 0;
      }

      rocketsRef.current.forEach(rocket => {
        rocket.progress += rocket.speed * (deltaTime / 16);
        rocket.x = rocket.x + (rocket.targetX - rocket.x) * (rocket.speed * (deltaTime / 16) / (1 - rocket.progress + 0.0001));
        rocket.y = rocket.progress * rocket.targetY;
      });

      rocketsRef.current = rocketsRef.current.filter(rocket => {
        if (rocket.progress >= 1) {
          setTurrets(prev => prev.map(t => {
            if (Math.abs(t.x - rocket.targetX) < 5 && Math.abs(t.y - rocket.targetY) < 5) {
              return { ...t, destroyed: true };
            }
            return t;
          }));
          setCities(prev => prev.map(c => {
            if (Math.abs(c.x - rocket.targetX) < 5 && Math.abs(c.y - rocket.targetY) < 5) {
              return { ...c, destroyed: true };
            }
            return c;
          }));
          
          explosionsRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: rocket.targetX,
            y: rocket.targetY,
            radius: 0,
            maxRadius: EXPLOSION_MAX_RADIUS,
            duration: EXPLOSION_DURATION,
            elapsed: 0
          });
          return false;
        }
        return true;
      });

      missilesRef.current.forEach(missile => {
        missile.progress += missile.speed * (deltaTime / 16);
        missile.x = missile.startX + (missile.targetX - missile.startX) * missile.progress;
        missile.y = missile.startY + (missile.targetY - missile.startY) * missile.progress;
        
        if (missile.progress >= 1 && !missile.exploded) {
          missile.exploded = true;
          explosionsRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: missile.targetX,
            y: missile.targetY,
            radius: 0,
            maxRadius: EXPLOSION_MAX_RADIUS,
            duration: EXPLOSION_DURATION,
            elapsed: 0
          });
        }
      });
      missilesRef.current = missilesRef.current.filter(m => m.progress < 1);

      explosionsRef.current.forEach(exp => {
        exp.elapsed += deltaTime;
        const p = exp.elapsed / exp.duration;
        if (p < 0.5) {
          exp.radius = exp.maxRadius * (p * 2);
        } else {
          exp.radius = exp.maxRadius * (1 - (p - 0.5) * 2);
        }
      });

      explosionsRef.current.forEach(exp => {
        rocketsRef.current = rocketsRef.current.filter(rocket => {
          const dx = rocket.x - exp.x;
          const dy = rocket.y - exp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < exp.radius) {
            onScoreUpdate(POINTS_PER_ROCKET);
            explosionsRef.current.push({
              id: Math.random().toString(36).substr(2, 9),
              x: rocket.x,
              y: rocket.y,
              radius: 0,
              maxRadius: EXPLOSION_MAX_RADIUS,
              duration: EXPLOSION_DURATION,
              elapsed: 0
            });
            return false;
          }
          return true;
        });
      });

      explosionsRef.current = explosionsRef.current.filter(exp => exp.elapsed < exp.duration);

      if (rocketsToSpawnRef.current <= 0 && rocketsRef.current.length === 0 && waveInProgressRef.current) {
        waveInProgressRef.current = false;
        onWaveComplete();
      }

      if (turrets.every(t => t.destroyed) || cities.every(c => c.destroyed)) {
        onStatusChange(GameStatus.LOST);
      }
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Stars
    starsRef.current.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * (0.5 + Math.sin(Date.now() / 500) * 0.2)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Rockets
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    rocketsRef.current.forEach(rocket => {
      ctx.beginPath();
      ctx.moveTo(rocket.x - (rocket.targetX - rocket.x) * 0.1, rocket.y - (rocket.targetY - rocket.y) * 0.1);
      ctx.lineTo(rocket.x, rocket.y);
      ctx.stroke();
      
      // Rocket head glow
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(rocket.x - 1.5, rocket.y - 1.5, 3, 3);
      ctx.shadowBlur = 0;
    });

    // Draw Missiles
    missilesRef.current.forEach(missile => {
      // Trail
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(missile.startX, missile.startY);
      ctx.lineTo(missile.x, missile.y);
      ctx.stroke();

      // Missile Body
      const angle = Math.atan2(missile.targetY - missile.startY, missile.targetX - missile.startX);
      ctx.save();
      ctx.translate(missile.x, missile.y);
      ctx.rotate(angle);
      
      // Missile shape
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-5, -3);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
      
      // Flame
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(-10 - Math.random() * 5, 0);
      ctx.lineTo(-5, 2);
      ctx.fill();
      
      ctx.restore();
      
      // Target X
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(missile.targetX - 3, missile.targetY - 3);
      ctx.lineTo(missile.targetX + 3, missile.targetY + 3);
      ctx.moveTo(missile.targetX + 3, missile.targetY - 3);
      ctx.lineTo(missile.targetX - 3, missile.targetY + 3);
      ctx.stroke();
    });

    explosionsRef.current.forEach(exp => {
      const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.3, '#fbbf24');
      gradient.addColorStop(0.6, '#f59e0b');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    cities.forEach(city => {
      if (!city.destroyed) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(city.x - 15, city.y - 10, 30, 10);
        ctx.fillRect(city.x - 10, city.y - 15, 20, 5);
      }
    });

    turrets.forEach(turret => {
      if (!turret.destroyed) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 15, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(turret.x - 2, turret.y - 25, 4, 10);
      }
    });
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, turrets, cities]);

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    fireMissile(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      onMouseDown={handleCanvasClick}
      onTouchStart={handleCanvasClick}
      className="w-full h-full bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800"
    />
  );
};
