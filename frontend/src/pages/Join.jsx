import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function Join() {
  const navigate = useNavigate()
  const { roomCode: codeFromUrl } = useParams()
  const [playerName, setPlayerName] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [roomCode, setRoomCode] = useState(codeFromUrl || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredNames = ALL_NAMES.filter(n => n.toLowerCase().includes(nameSearch.toLowerCase()))

  useEffect(() => {
    const handleJoined = ({ room_code, player_id }) => {
      sessionStorage.setItem('player_id', player_id)
      sessionStorage.setItem('player_name', playerName.trim())
      sessionStorage.setItem('room_code', room_code)
      sessionStorage.removeItem('is_host')
      navigate(`/game/${room_code}`)
    }
    const handleError = ({ message }) => { setError(message); setLoading(false) }
    socket.on('joined_room', handleJoined)
    socket.on('error', handleError)
    return () => { socket.off('joined_room', handleJoined); socket.off('error', handleError) }
  }, [navigate, playerName])

  const handleJoin = () => {
    const name = playerName.trim()
    const code = roomCode.trim().toUpperCase()
    if (!name) return setError('Please choose your name from the list')
    if (!code) return setError('Please enter a room code')
    setError('')
    setLoading(true)
    const player_id = sessionStorage.getItem('player_id') || crypto.randomUUID()
    socket.emit('join_room', { player_id, player_name: name, room_code: code })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -0.5 }}
        transition={{ duration: 0.5 }}
        className="notebook-page w-full max-w-md rounded-2xl shadow-2xl p-10 pl-16 relative"
        style={{ boxShadow: '4px 4px 0 #c9c5b0, 8px 8px 0 #b5b09e' }}
      >
        <div className="spiral-binding">
          {Array.from({ length: 14 }).map((_, i) => <div key={i} className="spiral-ring" />)}
        </div>

        <button className="font-hand text-grey text-sm mb-6 hover:text-ink flex items-center gap-1" onClick={() => navigate('/')}>← back</button>

        <h2 className="font-hand text-3xl text-ink font-bold mb-1">🚪 Join a Game</h2>
        <p className="font-comic text-grey text-sm mb-8">Enter your details to join</p>

        <div className="space-y-6">
          {/* Name picker */}
          <div className="relative">
            <label className="font-hand text-ink text-base block mb-1">Your Name</label>
            {playerName ? (
              <div className="flex items-center gap-2 border-b-2 border-ink py-1">
                <span className="font-hand text-ink text-lg flex-1">👤 {playerName}</span>
                <button className="font-hand text-grey text-sm hover:text-no" onClick={() => { setPlayerName(''); setNameSearch('') }}>✕ change</button>
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
                          onMouseDown={() => { setPlayerName(name); setNameSearch(''); setShowDropdown(false) }}>
                          {name}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Room code */}
          <div>
            <label className="font-hand text-ink text-base block mb-1">Room Code</label>
            <input
              className="input-field uppercase tracking-widest text-xl text-btn font-bold"
              placeholder="e.g. ABXYZ"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
            />
          </div>

          {error && <p className="font-hand text-no text-sm">⚠️ {error}</p>}

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary w-full" onClick={handleJoin} disabled={loading}>
            {loading ? '⏳ Joining...' : '🎉 Join Room'}
          </motion.button>
        </div>

        <p className="font-comic text-grey text-xs text-center mt-4 opacity-60">You can also join via link: /room/ABXYZ</p>
        <Footer />
      </motion.div>
    </div>
  )
}