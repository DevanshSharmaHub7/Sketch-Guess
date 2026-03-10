import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import socket from '../socket'

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

const Footer = () => (
  <p className="font-hand text-grey text-xs text-center mt-6 opacity-70">
    Made with ❤️ by Devansh and Naman
  </p>
)

export default function Host() {
  const navigate = useNavigate()
  const [hostName, setHostName] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalQuestions = Math.max(1, (maxPlayers - 1)) * questionsPerPlayer
  const filteredNames = ALL_NAMES.filter(n => n.toLowerCase().includes(nameSearch.toLowerCase()))

  useEffect(() => {
    const handleRoomCreated = ({ room_code, player_id }) => {
      sessionStorage.setItem('player_id', player_id)
      sessionStorage.setItem('player_name', hostName.trim())
      sessionStorage.setItem('room_code', room_code)
      sessionStorage.setItem('is_host', 'true')
      navigate(`/game/${room_code}`)
    }
    const handleError = ({ message }) => { setError(message); setLoading(false) }
    socket.on('room_created', handleRoomCreated)
    socket.on('error', handleError)
    return () => { socket.off('room_created', handleRoomCreated); socket.off('error', handleError) }
  }, [navigate, hostName])

  const handleCreate = () => {
    const name = hostName.trim()
    if (!name) return setError('Please choose your name from the list')
    setError('')
    setLoading(true)
    const player_id = sessionStorage.getItem('player_id') || crypto.randomUUID()
    socket.emit('create_room', { player_id, host_name: name, max_players: maxPlayers, questions_per_player: questionsPerPlayer })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0.5 }}
        transition={{ duration: 0.5 }}
        className="notebook-page w-full max-w-md rounded-2xl shadow-2xl p-10 pl-16 relative"
        style={{ boxShadow: '4px 4px 0 #c9c5b0, 8px 8px 0 #b5b09e' }}
      >
        <div className="spiral-binding">
          {Array.from({ length: 14 }).map((_, i) => <div key={i} className="spiral-ring" />)}
        </div>

        <button className="font-hand text-grey text-sm mb-6 hover:text-ink flex items-center gap-1" onClick={() => navigate('/')}>← back</button>

        <h2 className="font-hand text-3xl text-ink font-bold mb-1">🏠 Host a Game</h2>
        <p className="font-comic text-grey text-sm mb-8">Set up your classroom room</p>

        <div className="space-y-6">
          {/* Name picker */}
          <div className="relative">
            <label className="font-hand text-ink text-base block mb-1">Your Name</label>
            {hostName ? (
              <div className="flex items-center gap-2 border-b-2 border-ink py-1">
                <span className="font-hand text-ink text-lg flex-1">👤 {hostName}</span>
                <button className="font-hand text-grey text-sm hover:text-no" onClick={() => { setHostName(''); setNameSearch('') }}>✕ change</button>
              </div>
            ) : (
              <div>
                <input
                  className="input-field"
                  placeholder="🔍 Search your name..."
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  autoComplete="off"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full bg-notebook border border-grid rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredNames.length === 0
                      ? <p className="font-hand text-grey text-sm p-3 text-center">No names found</p>
                      : filteredNames.map(name => (
                        <button key={name} className="w-full text-left px-4 py-2 font-hand text-sm text-ink hover:bg-grid transition-colors"
                          onMouseDown={() => { setHostName(name); setNameSearch(''); setShowDropdown(false) }}>
                          {name}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sliders */}
          <div>
            <label className="font-hand text-ink text-base block mb-1">Max Players: <span className="text-btn font-bold">{maxPlayers}</span></label>
            <input type="range" min={2} max={28} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full accent-btn" />
            <div className="flex justify-between font-comic text-grey text-xs mt-1"><span>2</span><span>28</span></div>
          </div>
          <div>
            <label className="font-hand text-ink text-base block mb-1">Questions per Player: <span className="text-btn font-bold">{questionsPerPlayer}</span></label>
            <input type="range" min={1} max={10} value={questionsPerPlayer} onChange={e => setQuestionsPerPlayer(Number(e.target.value))} className="w-full accent-btn" />
            <div className="flex justify-between font-comic text-grey text-xs mt-1"><span>1</span><span>10</span></div>
          </div>

          <div className="border-2 border-dashed border-grid rounded-xl p-4 font-hand text-ink text-sm space-y-1">
            <p>👥 Players: <strong>{maxPlayers}</strong></p>
            <p>❓ Questions per player: <strong>{questionsPerPlayer}</strong></p>
            <p className="text-btn font-bold text-base">📋 Total questions: {totalQuestions}</p>
          </div>

          {error && <p className="font-hand text-no text-sm">⚠️ {error}</p>}

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary w-full" onClick={handleCreate} disabled={loading}>
            {loading ? '⏳ Creating room...' : '🚀 Start Game'}
          </motion.button>
        </div>

        <Footer />
      </motion.div>
    </div>
  )
}