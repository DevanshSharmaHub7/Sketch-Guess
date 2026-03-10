import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket'

// ChatPanel manages its OWN local message list via socket events.
// It never reads from room_state, so game events never contaminate chat.
export default function ChatPanel({ myId, roomCode }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  // Listen for chat_message events directly
  useEffect(() => {
    const handler = (msg) => {
      setMessages(prev => [...prev, msg])
    }
    socket.on('chat_message', handler)
    return () => socket.off('chat_message', handler)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const msg = input.trim()
    if (!msg) return
    socket.emit('chat_message', { message: msg })
    setInput('')
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-hand text-ink text-lg font-bold mb-3">💬 Chat</h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
        {messages.length === 0 && (
          <p className="font-hand text-grey text-xs text-center opacity-60 mt-4">No messages yet...</p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.player_id === myId
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <span className="text-lg flex-shrink-0">{msg.avatar}</span>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <p className={`font-hand text-xs text-grey mb-0.5 ${isMe ? 'text-right' : ''}`}>
                    {msg.player_name}
                  </p>
                  <div className={`px-3 py-1.5 rounded-2xl font-hand text-sm ${isMe ? 'bg-btn text-white rounded-tr-sm' : 'bg-grid text-ink rounded-tl-sm'}`}>
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-grid pt-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={300}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          className="bg-btn text-white rounded-lg px-3 py-1 font-hand text-sm flex-shrink-0"
          onClick={send}
        >
          ✈️
        </motion.button>
      </div>
    </div>
  )
}