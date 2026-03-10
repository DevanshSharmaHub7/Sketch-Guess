import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const DOODLES = [
  { text: '?', x: '5%', y: '10%', rotate: -20, size: '4rem' },
  { text: '✏️', x: '88%', y: '8%', rotate: 15, size: '2.5rem' },
  { text: '?', x: '92%', y: '40%', rotate: 10, size: '3rem' },
  { text: '→', x: '3%', y: '55%', rotate: 0, size: '2rem' },
  { text: '⭐', x: '80%', y: '75%', rotate: -10, size: '2rem' },
  { text: '?', x: '10%', y: '80%', rotate: 25, size: '2.5rem' },
  { text: '🎯', x: '50%', y: '90%', rotate: 0, size: '1.8rem' },
]

const StickFigure = () => (
  <svg width="60" height="90" viewBox="0 0 60 90" fill="none" className="opacity-10 absolute" style={{ right: '8%', bottom: '15%' }}>
    <circle cx="30" cy="12" r="10" stroke="#1D3557" strokeWidth="2.5" />
    <line x1="30" y1="22" x2="30" y2="60" stroke="#1D3557" strokeWidth="2.5" />
    <line x1="30" y1="35" x2="10" y2="50" stroke="#1D3557" strokeWidth="2.5" />
    <line x1="30" y1="35" x2="50" y2="50" stroke="#1D3557" strokeWidth="2.5" />
    <line x1="30" y1="60" x2="15" y2="85" stroke="#1D3557" strokeWidth="2.5" />
    <line x1="30" y1="60" x2="45" y2="85" stroke="#1D3557" strokeWidth="2.5" />
  </svg>
)

const Footer = () => (
  <p className="font-hand text-grey text-xs text-center mt-6 opacity-70">
    Made with ❤️ by Devansh and Naman
  </p>
)

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {DOODLES.map((d, i) => (
        <div
          key={i}
          className="absolute select-none pointer-events-none text-ink opacity-10 font-hand"
          style={{ left: d.x, top: d.y, fontSize: d.size, transform: `rotate(${d.rotate}deg)` }}
        >
          {d.text}
        </div>
      ))}

      <StickFigure />

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -0.5 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="notebook-page relative w-full max-w-lg rounded-2xl shadow-2xl p-10 pl-16 overflow-hidden"
        style={{ boxShadow: '4px 4px 0 #c9c5b0, 8px 8px 0 #b5b09e' }}
      >
        <div className="spiral-binding">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="spiral-ring" />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-4xl">📝</span>
            <h1 className="font-hand text-5xl text-ink font-bold tracking-tight">SketchGuess</h1>
          </div>
          <p className="font-comic text-grey text-sm mb-8 ml-1">for OGs 😎</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-8 space-y-3">
          <p className="font-hand text-ink text-lg leading-relaxed">
            One player secretly gets a name from the class list.
          </p>
          <p className="font-hand text-ink text-lg leading-relaxed">
            Other players ask <span className="text-yes font-bold">YES</span> / <span className="text-no font-bold">NO</span> questions to guess who it is.
          </p>
          <p className="font-hand text-ink text-lg leading-relaxed">
            First correct guess wins the round! 🎉
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-8 border-l-4 border-pink pl-4 space-y-1">
          {[
            '👑 Host creates a room & invites players',
            '🎭 Secret holder gets a mystery name',
            '❓ Players ask YES/NO questions in turns',
            '🎯 Guess the name to win the round!',
          ].map((line, i) => (
            <p key={i} className="font-hand text-ink text-base">{line}</p>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 0.5 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={() => navigate('/host')}
          >
            🏠 Host Game
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, rotate: -0.5 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
            onClick={() => navigate('/join')}
          >
            🚪 Join Game
          </motion.button>
        </motion.div>

        <Footer />
      </motion.div>
    </div>
  )
}