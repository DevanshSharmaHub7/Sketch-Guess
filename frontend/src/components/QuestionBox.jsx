import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function QuestionBox({ qaHistory = [], onAnswer, isSecretHolder, canAnswer }) {
  return (
    <div className="space-y-2">
      <h4 className="font-hand text-ink text-base font-bold">Questions & Answers</h4>

      {qaHistory.length === 0 && (
        <p className="font-hand text-grey text-sm italic">No questions asked yet...</p>
      )}

      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {qaHistory.map((qa, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-grid rounded-lg p-2 bg-notebook"
            >
              <p className="font-hand text-ink text-sm">
                <span className="text-grey text-xs">{qa.asker}: </span>
                {qa.question}
              </p>

              {qa.answer ? (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`font-hand font-bold text-sm mt-1 ${qa.answer === 'YES' ? 'text-yes' : 'text-no'}`}
                >
                  {qa.answer === 'YES' ? '✅ YES' : '❌ NO'}
                </motion.p>
              ) : isSecretHolder && canAnswer && i === qaHistory.length - 1 ? (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="answer-yes text-sm py-1 px-3"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAnswer('YES') }}
                  >
                    ✅ YES
                  </button>
                  <button
                    type="button"
                    className="answer-no text-sm py-1 px-3"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAnswer('NO') }}
                  >
                    ❌ NO
                  </button>
                </div>
              ) : (
                <p className="font-hand text-grey text-xs mt-1 italic">
                  {isSecretHolder ? 'Answer this!' : 'Waiting for answer...'}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}