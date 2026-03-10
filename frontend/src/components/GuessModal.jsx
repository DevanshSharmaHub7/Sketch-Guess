import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ALL_NAMES = [
  "Aarav","Aditya","Akash","Aman","Ananya","Arjun","Arnav","Avni",
  "Ayaan","Bhavya","Chirag","Devansh","Dhruv","Diya","Eshan","Farhan",
  "Gaurav","Ishaan","Ishika","Jatin","Kabir","Kavya","Krish","Lakshmi",
  "Manav","Meera","Mihir","Naman","Neha","Nikhil","Nisha","Om",
  "Parth","Pooja","Pranav","Priya","Rahul","Ranya","Rishi","Rohit",
  "Saanvi","Sahil","Saksham","Shreya","Siddharth","Sneha","Tanvi","Varun",
  "Maths Sir","Physics Sir","Chemistry Ma'am","Biology Ma'am",
  "English Sir","History Ma'am","Geography Sir","Computer Sir",
  "P.E. Sir","Art Ma'am",
]

export default function GuessModal({ onClose, onGuess }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')

  const filtered = useMemo(() =>
    ALL_NAMES.filter(n => n.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  const handleSubmit = () => {
    if (selected) onGuess(selected)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="notebook-page w-full max-w-sm rounded-2xl shadow-2xl p-6 pl-12 relative"
          style={{ boxShadow: '4px 4px 0 #c9c5b0' }}
        >
          <div className="spiral-binding">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="spiral-ring" />)}
          </div>

          <h3 className="font-hand text-ink text-2xl font-bold mb-1">🎯 Make a Guess</h3>
          <p className="font-comic text-grey text-sm mb-4">Who do you think it is?</p>

          <input
            className="input-field mb-3"
            placeholder="🔍 Search names..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected('') }}
            autoFocus
          />

          <div className="max-h-48 overflow-y-auto border border-grid rounded-lg mb-4">
            {filtered.length === 0 ? (
              <p className="font-hand text-grey text-sm p-3 text-center">No names found</p>
            ) : (
              filtered.map(name => (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className={`
                    w-full text-left px-4 py-2 font-hand text-sm transition-colors
                    ${selected === name ? 'bg-btn text-white' : 'text-ink hover:bg-grid'}
                  `}
                >
                  {name}
                </button>
              ))
            )}
          </div>

          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-2 bg-pink bg-opacity-20 border border-pink rounded-lg text-center"
            >
              <p className="font-hand text-ink text-sm">Your guess: <strong className="text-btn">{selected}</strong></p>
            </motion.div>
          )}

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary flex-1"
              onClick={handleSubmit}
              disabled={!selected}
            >
              🎯 Guess!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
