import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlayerSidebar({ players = {}, playerOrder = [], secretHolderId, currentTurnId, myId }) {
  const orderedPlayers = playerOrder.map(id => players[id]).filter(Boolean)
  const connectedCount = orderedPlayers.filter(p => p.connected !== false).length

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-hand text-ink text-lg font-bold mb-1 flex items-center gap-2">
        👥 Players
      </h3>
      <p className="font-comic text-grey text-xs mb-3">
        {connectedCount}/{orderedPlayers.length} online
      </p>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {orderedPlayers.map((player, idx) => {
            const isHolder = player.id === secretHolderId
            const isTurn = player.id === currentTurnId
            const isMe = player.id === myId
            const isDisconnected = player.connected === false

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-lg border
                  ${isDisconnected
                    ? 'bg-grid bg-opacity-20 border-dashed border-grey opacity-50'
                    : isTurn
                      ? 'border-btn bg-blue-50'
                      : 'border-grid bg-grid bg-opacity-20'}
                `}
              >
                {/* Pulse ring on current turn */}
                {isTurn && !isDisconnected && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-btn"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  />
                )}

                <span className="text-xl z-10">{player.avatar}</span>

                <div className="flex-1 min-w-0 z-10">
                  <p className={`font-hand text-sm truncate leading-tight
                    ${isMe ? 'text-btn font-bold' : 'text-ink'}
                    ${isDisconnected ? 'line-through text-grey' : ''}`}>
                    {player.name}{isMe ? ' (you)' : ''}
                  </p>
                  <p className="font-comic text-grey text-xs">
                    🏆 {player.score} pts
                  </p>
                </div>

                {/* Status badges */}
                <div className="flex flex-col items-end gap-0.5 z-10 flex-shrink-0">
                  {isHolder && (
                    <span title="Secret holder" className="text-sm">⭐</span>
                  )}
                  {isTurn && !isDisconnected && (
                    <span title="Their turn" className="text-sm">🎯</span>
                  )}
                  {isDisconnected && (
                    <span
                      title="Left the game"
                      className="font-hand text-xs bg-grey text-white px-1.5 py-0.5 rounded-full leading-none"
                    >
                      left
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-2 border-t border-grid">
        <p className="font-hand text-grey text-xs text-center opacity-70">
          ⭐ secret · 🎯 turn · left = disconnected
        </p>
      </div>
    </div>
  )
}