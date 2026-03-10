import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function Timer({ seconds = 60, onExpire, active = true, key: timerKey }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setTimeLeft(seconds)
  }, [timerKey, seconds])

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active, timerKey])

  const pct = timeLeft / seconds
  const color = pct > 0.5 ? '#2DC653' : pct > 0.25 ? '#FB8500' : '#E63946'
  const circumference = 2 * Math.PI * 22

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      animate={timeLeft <= 10 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.8 }}
    >
      <svg width="60" height="60" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="none" stroke="#DAD7C9" strokeWidth="4" />
        <circle
          cx="25" cy="25" r="22"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 25 25)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
        <text
          x="25" y="30"
          textAnchor="middle"
          fontSize="14"
          fontFamily="Patrick Hand, cursive"
          fill={color}
          fontWeight="bold"
        >
          {timeLeft}
        </text>
      </svg>
      <span className="font-hand text-grey text-xs">seconds</span>
    </motion.div>
  )
}
