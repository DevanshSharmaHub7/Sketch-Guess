import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const socket = io("https://sketchguess7.onrender.com/", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
})

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason)
})

socket.on('connect_error', (err) => {
  console.error('[Socket] Connect error:', err.message)
})

export default socket
