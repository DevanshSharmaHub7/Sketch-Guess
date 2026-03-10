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

export default function SecretPickerModal({ myName, onConfirm }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')

  const filtered = useMemo(() =>
    ALL_NAMES.filter(n => n.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="notebook-page w-full max-w-sm rounded-2xl shadow-2xl p-8 pl-14 relative"
        style={{ boxShadow: '5px 5px 0 #c9c5b0, 10px 10px 0 #b5b09e' }}
      >
        <div className="spiral-binding">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="spiral-ring" />)}
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-4xl mb-2">🤫</p>
          <h3 className="font-hand text-ink text-2xl font-bold">You're the Secret Holder!</h3>
          <p className="font-comic text-grey text-sm mt-1">
            Pick a name — others will try to guess it
          </p>
        </div>

        {/* Search */}
        <input
          className="input-field mb-3 w-full"
          placeholder="🔍 Search a name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected('') }}
          autoFocus
        />

        {/* Name list */}
        <div className="max-h-48 overflow-y-auto border border-grid rounded-lg mb-4 bg-notebook">
          {filtered.length === 0 ? (
            <p className="font-hand text-grey text-sm p-3 text-center">No names found</p>
          ) : (
            filtered.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={`w-full text-left px-4 py-2 font-hand text-sm transition-colors
                  ${selected === name ? 'bg-btn text-white' : 'text-ink hover:bg-grid'}`}
              >
                {name}
              </button>
            ))
          )}
        </div>

        {/* Selected preview */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-btn bg-opacity-10 border-2 border-btn rounded-xl text-center"
            >
              <p className="font-hand text-grey text-xs mb-0.5">Your secret name:</p>
              <p className="font-hand text-ink text-xl font-bold text-btn">{selected}</p>
              <p className="font-hand text-grey text-xs mt-1">Don't tell anyone! 🤐</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: selected ? 1.04 : 1 }}
          whileTap={{ scale: selected ? 0.96 : 1 }}
          className={`btn-primary w-full ${!selected ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
        >
          🔒 Lock it in!
        </motion.button>
      </motion.div>
    </div>
  )
}