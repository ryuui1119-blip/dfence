/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Trophy, AlertTriangle, Languages, Info } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { GameStatus, Turret, City } from './types';
import { 
  INITIAL_TURRETS, 
  INITIAL_CITIES, 
  I18N, 
  WIN_SCORE,
  POINTS_PER_MISSILE
} from './constants';

export default function App() {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [turrets, setTurrets] = useState<Turret[]>(INITIAL_TURRETS);
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [wave, setWave] = useState(1);

  const t = I18N[lang];

  const startGame = () => {
    setScore(0);
    setWave(1);
    setTurrets(INITIAL_TURRETS.map(t => ({ ...t, missiles: t.maxMissiles, destroyed: false })));
    setCities(INITIAL_CITIES.map(c => ({ ...c, destroyed: false })));
    setStatus(GameStatus.PLAYING);
  };

  const handleScoreUpdate = useCallback((points: number) => {
    setScore(prev => {
      const newScore = prev + points;
      if (newScore >= WIN_SCORE) {
        setStatus(GameStatus.WON);
      }
      return newScore;
    });
  }, []);

  const handleWaveComplete = useCallback(() => {
    // Add bonus points for remaining missiles
    const bonus = turrets.reduce((acc, curr) => acc + (curr.destroyed ? 0 : curr.missiles * POINTS_PER_MISSILE), 0);
    setScore(prev => {
      const newScore = prev + bonus;
      if (newScore >= WIN_SCORE) {
        setStatus(GameStatus.WON);
      }
      return newScore;
    });

    // Refill missiles
    setTurrets(prev => prev.map(t => t.destroyed ? t : { ...t, missiles: t.maxMissiles }));
    setWave(prev => prev + 1);
  }, [turrets]);

  const handleStatusChange = useCallback((newStatus: GameStatus) => {
    setStatus(newStatus);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-zinc-950">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 leading-none">
              {t.title}
            </h1>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Wave {wave}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{t.score}</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{score.toString().padStart(4, '0')}</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <Languages className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-3xl aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
        <GameCanvas 
          status={status}
          level={wave}
          onScoreUpdate={handleScoreUpdate}
          onStatusChange={handleStatusChange}
          onWaveComplete={handleWaveComplete}
          turrets={turrets}
          cities={cities}
          setTurrets={setTurrets}
          setCities={setCities}
        />

        {/* HUD Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
          <div className="flex gap-4 md:gap-8">
            {turrets.map((turret, idx) => (
              <div key={turret.id} className={`flex flex-col items-center ${turret.destroyed ? 'opacity-30' : ''}`}>
                <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">BATT {idx + 1}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-3 rounded-full ${i < (turret.missiles / turret.maxMissiles) * 10 ? 'bg-blue-500' : 'bg-zinc-800'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-blue-400 mt-1">{turret.missiles}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Screens */}
        <AnimatePresence>
          {status !== GameStatus.PLAYING && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-8 text-center"
            >
              {status === GameStatus.START && (
                <motion.div 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="max-w-md"
                >
                  <Target className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                  <h2 className="text-4xl font-bold mb-4 text-zinc-100">{t.title}</h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed">
                    {t.instructions}
                  </p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    {t.start}
                  </button>
                </motion.div>
              )}

              {status === GameStatus.WON && (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <Trophy className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
                  <h2 className="text-5xl font-bold mb-2 text-emerald-400">{t.win}</h2>
                  <p className="text-2xl font-mono text-zinc-300 mb-8">{t.score}: {score}</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    {t.playAgain}
                  </button>
                </motion.div>
              )}

              {status === GameStatus.LOST && (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                  <h2 className="text-4xl font-bold mb-2 text-red-500">{t.loss}</h2>
                  <p className="text-2xl font-mono text-zinc-300 mb-8">{t.score}: {score}</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    {t.playAgain}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex items-center gap-2 text-zinc-500 text-sm">
        <Info className="w-4 h-4" />
        <p>{lang === 'en' ? 'Lead your shots to intercept incoming threats.' : '预判敌方轨迹进行拦截。'}</p>
      </div>
    </div>
  );
}
