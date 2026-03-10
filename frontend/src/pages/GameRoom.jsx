import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import socket from '../socket'
import PlayerSidebar from '../components/PlayerSidebar'
import ChatPanel from '../components/ChatPanel'
import Timer from '../components/Timer'
import GuessModal from '../components/GuessModal'
import QuestionBox from '../components/QuestionBox'
import SecretPickerModal from '../components/SecretPickerModal'

function useSession() {
  return {
    playerId: sessionStorage.getItem('player_id'),
    playerName: sessionStorage.getItem('player_name'),
    isHost: sessionStorage.getItem('is_host') === 'true',
  }
}

const Footer = () => (
  <p className="font-hand text-grey text-xs text-center py-2 opacity-60">
    Made with ❤️ by Devansh and Naman
  </p>
)

export default function GameRoom() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { playerId, playerName, isHost } = useSession()

  const [room, setRoom] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showGuess, setShowGuess] = useState(false)
  const [questionInput, setQuestionInput] = useState('')
  const [timerKey, setTimerKey] = useState(0)
  const [showMobileTab, setShowMobileTab] = useState('game')
  const [copied, setCopied] = useState(false)
  const [roundEndInfo, setRoundEndInfo] = useState(null)
  const notifTimeout = useRef(null)
  const hasJoined = useRef(false)

  const notify = useCallback((msg, color = 'ink') => {
    if (notifTimeout.current) clearTimeout(notifTimeout.current)
    setNotification({ msg, color })
    notifTimeout.current = setTimeout(() => setNotification(null), 4000)
  }, [])

  // Join room on mount — only once
  useEffect(() => {
    if (!playerId || !playerName || !roomCode) {
      navigate(`/room/${roomCode || ''}`)
      return
    }
    if (!hasJoined.current) {
      hasJoined.current = true
      socket.emit('join_room', { player_id: playerId, player_name: playerName, room_code: roomCode })
    }
  }, [])

  // Re-join after socket reconnect
  useEffect(() => {
    const handleReconnect = () => {
      if (playerId && playerName && roomCode) {
        socket.emit('join_room', { player_id: playerId, player_name: playerName, room_code: roomCode })
      }
    }
    socket.on('connect', handleReconnect)
    return () => socket.off('connect', handleReconnect)
  }, [playerId, playerName, roomCode])

  useEffect(() => {
    // Absorb joined_room here so stale Join/Host listeners don't navigate away
    const noOp = () => {}
    socket.on('joined_room', noOp)

    socket.on('room_state', setRoom)

    socket.on('game_started', ({ round }) => {
      setTimerKey(k => k + 1)
      notify('🎮 Game started! Round ' + round, 'btn')
      setRoundEndInfo(null)
    })

    socket.on('secret_chosen', ({ secret_holder_id }) => {
      if (secret_holder_id !== playerId) {
        notify('🔒 Secret chosen — game begins!', 'btn')
      }
      setTimerKey(k => k + 1)
    })

    socket.on('round_started', ({ round }) => {
      setTimerKey(k => k + 1)
      setRoundEndInfo(null)
      notify('🔄 Round ' + round + ' started!', 'btn')
    })

    socket.on('question_answered', () => setTimerKey(k => k + 1))

    socket.on('round_end', (info) => {
      setRoundEndInfo(info)
      if (info.winner_id) {
        confetti({
          particleCount: 180, spread: 90,
          origin: { y: 0.5 },
          colors: ['#3A86FF', '#FF8FAB', '#2DC653', '#FB8500'],
        })
      }
    })

    socket.on('wrong_guess', ({ player_id, guess }) => {
      setRoom(prev => {
        const name = prev?.players?.[player_id]?.name || 'Someone'
        notify(`❌ ${name} guessed "${guess}" — wrong!`, 'no')
        return prev
      })
      setTimerKey(k => k + 1)
    })

    socket.on('player_disconnected', ({ player_id, player_name }) => {
      notify(`👋 ${player_name} left the game`, 'warn')
    })

    socket.on('player_joined', ({ player }) => {
      if (player?.name) notify(`🎉 ${player.name} joined!`, 'btn')
    })

    socket.on('turn_skipped', () => {
      setTimerKey(k => k + 1)
      notify('⏭️ Turn skipped (time up)!', 'warn')
    })

    socket.on('error', ({ message }) => notify('⚠️ ' + message, 'no'))

    return () => {
      ;['joined_room','room_state','game_started','secret_chosen','round_started',
        'question_answered','round_end','wrong_guess','player_disconnected',
        'player_joined','turn_skipped','error'].forEach(e => socket.off(e))
    }
  }, [notify, playerId])

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="notebook-page rounded-2xl p-10 pl-16 shadow-xl text-center">
          <p className="font-hand text-ink text-2xl">⏳ Connecting to room...</p>
          <p className="font-comic text-grey text-sm mt-2">{roomCode}</p>
        </motion.div>
        <Footer />
      </div>
    )
  }

  const isSecretHolder = room.secret_holder_id === playerId
  const isMyTurn = room.current_turn_id === playerId
  const secretHolder = room.players?.[room.secret_holder_id]
  const currentTurnPlayer = room.players?.[room.current_turn_id]
  const awaitingAnswer = room.qa_history?.length > 0 &&
    !room.qa_history[room.qa_history.length - 1]?.answer
  const questionsExhausted = room.questions_left === 0 && room.phase === 'playing'

  const handleChooseSecret = (name) => socket.emit('choose_secret', { secret_name: name })
  const handleAskQuestion = () => {
    const q = questionInput.trim()
    if (!q || questionsExhausted) return
    socket.emit('ask_question', { question: q })
    setQuestionInput('')
  }
  const handleAnswer = (answer) => socket.emit('answer_question', { answer })
  const handleGuess = (guess) => { setShowGuess(false); socket.emit('guess_name', { guess }) }
  const handleSkipTurn = () => socket.emit('skip_turn', {})
  const handleStartGame = () => socket.emit('start_game', {})
  const handleNextRound = () => socket.emit('next_round', {})
  const handleCopyCode = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/room/${roomCode}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const playerCount = Object.keys(room.players || {}).length
  const canStart = playerCount >= 2

  return (
    <div className="min-h-screen flex flex-col p-2 md:p-4 gap-3">

      {/* Top bar */}
      <div className="flex items-center justify-between px-2">
        <h1 className="font-hand text-ink text-2xl font-bold">📝 SketchGuess</h1>
        <button onClick={handleCopyCode}
          className="font-hand text-ink text-sm border border-grid rounded-lg px-3 py-1 hover:bg-grid transition-colors">
          {copied ? '✅ Copied!' : `🔗 ${roomCode}`}
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="flex md:hidden gap-2 px-2">
        {['game', 'players', 'chat'].map(tab => (
          <button key={tab} onClick={() => setShowMobileTab(tab)}
            className={`flex-1 font-hand text-sm py-1.5 rounded-lg border transition-colors
              ${showMobileTab === tab ? 'bg-btn text-white border-btn' : 'bg-notebook border-grid text-ink'}`}>
            {tab === 'game' ? '🎮 Game' : tab === 'players' ? '👥 Players' : '💬 Chat'}
          </button>
        ))}
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`mx-2 rounded-xl px-4 py-2 font-hand text-sm text-center shadow
              ${notification.color === 'no' ? 'bg-no text-white' :
                notification.color === 'warn' ? 'bg-warn text-white' :
                notification.color === 'btn' ? 'bg-btn text-white' : 'bg-ink text-notebook'}`}>
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret picker — full screen modal for secret holder */}
      {room.phase === 'choosing_secret' && isSecretHolder && (
        <SecretPickerModal myName={playerName} onConfirm={handleChooseSecret} />
      )}

      {/* Main layout */}
      <div className="flex-1 flex gap-3">

        {/* LEFT: Players */}
        <motion.div className={`w-52 flex-shrink-0 notebook-page rounded-2xl shadow-lg p-4 pl-10 relative flex-col
          ${showMobileTab !== 'players' ? 'hidden md:flex' : 'flex'}`}>
          <div className="spiral-binding">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="spiral-ring" />)}
          </div>
          <PlayerSidebar
            players={room.players}
            playerOrder={room.player_order}
            secretHolderId={room.secret_holder_id}
            currentTurnId={room.current_turn_id}
            myId={playerId}
          />
        </motion.div>

        {/* CENTER */}
        <div className={`flex-1 flex flex-col gap-3 ${showMobileTab !== 'game' ? 'hidden md:flex' : 'flex'}`}>

          {/* Round end */}
          <AnimatePresence>
            {roundEndInfo && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="notebook-page rounded-2xl shadow-2xl p-8 pl-14 relative text-center border-2 border-pink">
                <div className="spiral-binding">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="spiral-ring" />)}</div>
                {roundEndInfo.winner_id ? (
                  <>
                    <p className="text-5xl mb-3">🎉</p>
                    <h2 className="font-hand text-ink text-3xl font-bold">
                      {room.players?.[roundEndInfo.winner_id]?.name} guessed correctly!
                    </h2>
                    <p className="font-hand text-grey text-lg mt-2">
                      The secret name was <strong className="text-btn">{roundEndInfo.secret_name}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl mb-3">😅</p>
                    <h2 className="font-hand text-ink text-2xl font-bold">Round Over!</h2>
                    <p className="font-hand text-grey text-lg mt-2">
                      Nobody guessed it. The name was <strong className="text-btn">{roundEndInfo.secret_name}</strong>
                    </p>
                  </>
                )}
                {isHost && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn-primary mt-6" onClick={handleNextRound}>
                    ▶️ Next Round
                  </motion.button>
                )}
                <div className="mt-6"><Footer /></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lobby */}
          {!room.started && !roundEndInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="notebook-page rounded-2xl shadow-lg p-8 pl-14 relative text-center flex-1 flex flex-col items-center justify-center gap-6">
              <div className="spiral-binding">{Array.from({ length: 14 }).map((_, i) => <div key={i} className="spiral-ring" />)}</div>
              <div>
                <p className="text-5xl mb-3">🎭</p>
                <h2 className="font-hand text-ink text-3xl font-bold">Waiting for players...</h2>
                <p className="font-hand text-grey text-lg mt-2">
                  {playerCount} / {room.max_players} players joined
                </p>
                <p className="font-comic text-grey text-sm mt-1">
                  Share code: <strong className="text-btn tracking-widest">{roomCode}</strong>
                </p>
              </div>
              {isHost ? (
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: canStart ? 1.05 : 1 }}
                    whileTap={{ scale: canStart ? 0.95 : 1 }}
                    className={`btn-primary text-xl px-10 py-4 ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleStartGame}
                    disabled={!canStart}
                  >
                    🚀 Start Game
                  </motion.button>
                  {!canStart && (
                    <p className="font-hand text-grey text-sm">Need at least 2 players</p>
                  )}
                </div>
              ) : (
                <p className="font-hand text-grey text-base">Waiting for host to start...</p>
              )}
              <Footer />
            </motion.div>
          )}

          {/* Choosing secret — waiting screen for non-holders */}
          {room.phase === 'choosing_secret' && !isSecretHolder && !roundEndInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="notebook-page rounded-2xl shadow-lg p-8 pl-14 relative text-center flex-1 flex flex-col items-center justify-center gap-4">
              <div className="spiral-binding">{Array.from({ length: 14 }).map((_, i) => <div key={i} className="spiral-ring" />)}</div>
              <motion.p className="text-5xl"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}>
                🤫
              </motion.p>
              <h2 className="font-hand text-ink text-2xl font-bold">
                {secretHolder?.name} is choosing a secret name...
              </h2>
              <p className="font-comic text-grey text-base">Get ready to ask questions!</p>
              <div className="flex gap-2 mt-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-3 h-3 rounded-full bg-btn"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.25 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Playing */}
          {room.phase === 'playing' && !roundEndInfo && (
            <div className="flex flex-col gap-3 flex-1">

              {/* Status bar */}
              <div className="notebook-page rounded-xl shadow-md p-4 pl-10 relative flex items-center gap-4 flex-wrap">
                <div className="spiral-binding" style={{ top: 10, bottom: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="spiral-ring" style={{ width: 14, height: 14 }} />)}
                </div>
                <div className="font-hand text-ink text-sm">
                  <span className="text-grey">Round </span>
                  <strong className="text-btn text-lg">{room.round_number}</strong>
                </div>
                <div className={`font-hand text-sm px-2 py-0.5 rounded-lg border
                  ${questionsExhausted ? 'bg-no text-white border-red-700' :
                    room.questions_left <= 3 ? 'bg-warn text-white border-orange-600' :
                    'text-ink border-grid'}`}>
                  {questionsExhausted ? '🚫 Guess only!' : `❓ ${room.questions_left} questions left`}
                </div>
                {currentTurnPlayer && (
                  <div className="font-hand text-ink text-sm">
                    <span className="text-grey">Turn: </span>
                    <strong>{currentTurnPlayer.avatar} {currentTurnPlayer.name}</strong>
                    {isMyTurn && <span className="text-btn font-bold"> ← you!</span>}
                  </div>
                )}
                {isMyTurn && (
                  <div className="ml-auto">
                    <Timer seconds={60} key={timerKey} timerKey={timerKey} active={true} onExpire={handleSkipTurn} />
                  </div>
                )}
              </div>

              {/* Secret identity */}
              <motion.div layout className="notebook-page rounded-xl shadow-md p-5 pl-12 relative text-center">
                <div className="spiral-binding" style={{ top: 10, bottom: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="spiral-ring" style={{ width: 14, height: 14 }} />)}
                </div>
                <p className="font-hand text-grey text-sm mb-2">🎭 Secret Identity</p>
                {isSecretHolder ? (
                  <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <p className="font-hand text-4xl font-bold text-btn">{room.secret_name}</p>
                    <p className="font-comic text-grey text-sm mt-1">Only you can see this! 🤫</p>
                    <p className="font-hand text-pink text-sm mt-1">Answer YES or NO to questions below</p>
                  </motion.div>
                ) : (
                  <div>
                    <p className="font-hand text-5xl tracking-[0.3em] text-grey">?????</p>
                    <p className="font-comic text-grey text-sm mt-1">Ask questions to figure it out!</p>
                    <p className="font-hand text-grey text-xs mt-0.5">
                      Secret holder: {secretHolder?.avatar} {secretHolder?.name}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Q&A history */}
              <div className="notebook-page rounded-xl shadow-md p-5 pl-12 relative flex-1">
                <div className="spiral-binding" style={{ top: 10, bottom: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="spiral-ring" style={{ width: 14, height: 14 }} />)}
                </div>
                <QuestionBox
                  qaHistory={room.qa_history}
                  onAnswer={handleAnswer}
                  isSecretHolder={isSecretHolder}
                  canAnswer={isSecretHolder && awaitingAnswer}
                />
              </div>

              {/* Action bar */}
              {!isSecretHolder && (
                <div className="notebook-page rounded-xl shadow-md p-4 pl-12 relative">
                  <div className="spiral-binding" style={{ top: 10, bottom: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="spiral-ring" style={{ width: 14, height: 14 }} />)}
                  </div>
                  {isMyTurn && !awaitingAnswer ? (
                    <div className="flex flex-col gap-3">
                      <p className="font-hand text-ink text-base font-bold">🎯 It's your turn!</p>
                      <div className={`flex gap-2 ${questionsExhausted ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input
                          className="input-field flex-1"
                          placeholder={questionsExhausted ? '🚫 No more questions' : 'Ask a YES/NO question...'}
                          value={questionInput}
                          onChange={e => setQuestionInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !questionsExhausted && handleAskQuestion()}
                          maxLength={200}
                          disabled={questionsExhausted}
                        />
                        <motion.button whileTap={{ scale: 0.95 }}
                          className="btn-primary whitespace-nowrap px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={handleAskQuestion}
                          disabled={!questionInput.trim() || questionsExhausted}>
                          ❓ Ask
                        </motion.button>
                      </div>
                      <div>
                        {questionsExhausted && (
                          <p className="font-hand text-warn text-sm mb-2 text-center font-bold">
                            ⚠️ All questions used — you must guess now!
                          </p>
                        )}
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className="btn-secondary w-full" onClick={() => setShowGuess(true)}>
                          🎯 Guess Name
                        </motion.button>
                      </div>
                    </div>
                  ) : awaitingAnswer ? (
                    <p className="font-hand text-grey text-sm text-center py-2">
                      ⏳ Waiting for {secretHolder?.name} to answer...
                    </p>
                  ) : (
                    <p className="font-hand text-grey text-sm text-center py-2">
                      ⏳ Waiting for {currentTurnPlayer?.name}'s turn...
                    </p>
                  )}
                </div>
              )}

              {isSecretHolder && !awaitingAnswer && (
                <div className="notebook-page rounded-xl p-4 pl-12 relative text-center">
                  <div className="spiral-binding" style={{ top: 10, bottom: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="spiral-ring" style={{ width: 14, height: 14 }} />)}
                  </div>
                  <p className="font-hand text-grey text-sm">
                    ⏳ Waiting for {currentTurnPlayer?.name} to {questionsExhausted ? 'guess' : 'ask a question'}...
                  </p>
                </div>
              )}

              <Footer />
            </div>
          )}
        </div>

        {/* RIGHT: Chat */}
        <motion.div
          className={`w-56 flex-shrink-0 notebook-page rounded-2xl shadow-lg p-4 pl-10 relative flex-col
            ${showMobileTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}
          style={{ minHeight: '300px' }}
        >
          <div className="spiral-binding">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="spiral-ring" />)}</div>
          <ChatPanel myId={playerId} roomCode={roomCode} />
        </motion.div>
      </div>

      {showGuess && <GuessModal onClose={() => setShowGuess(false)} onGuess={handleGuess} />}
    </div>
  )
}