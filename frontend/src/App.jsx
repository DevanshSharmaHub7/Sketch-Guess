import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Host from './pages/Host'
import Join from './pages/Join'
import GameRoom from './pages/GameRoom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<Host />} />
        <Route path="/join" element={<Join />} />
        <Route path="/room/:roomCode" element={<Join />} />
        <Route path="/game/:roomCode" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
