import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../../types';
import { ROLES } from '../../constants';
import { Button } from '../ui/button';
import { Trophy, Skull } from 'lucide-react';

interface GameEndRevealProps {
  isOpen: boolean;
  gameState: GameState;
  winner: 'GOOD' | 'EVIL';
  onRestart: () => void;
}

export const GameEndReveal: React.FC<GameEndRevealProps> = ({ isOpen, gameState, winner, onRestart }) => {
  if (!isOpen) return null;

  const isGoodWin = winner === 'GOOD';
  const teamColor = isGoodWin ? 'text-blue-400' : 'text-red-500';
  const bgColor = isGoodWin ? 'bg-blue-950/90' : 'bg-red-950/90';
  const borderColor = isGoodWin ? 'border-blue-800' : 'border-red-800';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-lg border-2 ${borderColor} ${bgColor} shadow-2xl`}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-4 rounded-full bg-black/30 mb-4"
            >
              {isGoodWin ? <Trophy className="w-16 h-16 text-blue-400" /> : <Skull className="w-16 h-16 text-red-500" />}
            </motion.div>
            <h1 className={`text-5xl font-cinzel font-bold ${teamColor} tracking-widest mb-2`}>
              {isGoodWin ? 'GOOD WINS' : 'EVIL WINS'}
            </h1>
            <p className="text-stone-400 font-serif italic">The truth is revealed...</p>
          </div>

          {/* Role Reveal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {gameState.seats.map((seat, idx) => {
              const role = seat.realRoleId ? ROLES[seat.realRoleId] : null;
              return (
                <motion.div
                  key={seat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded bg-black/40 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-xl">
                    {role?.team === 'DEMON' ? '👿' : role?.team === 'MINION' ? '🧪' : role?.team === 'OUTSIDER' ? '🎭' : '⚜️'}
                  </div>
                  <div>
                    <div className="font-bold text-stone-200">{seat.userName}</div>
                    <div className={`text-sm ${role?.team === 'EVIL' || role?.team === 'DEMON' || role?.team === 'MINION' ? 'text-red-400' : 'text-blue-300'}`}>
                      {role?.name || 'Unknown'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onRestart}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-cinzel"
            >
              Start New Game
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
