# 📝 SketchGuess

A real-time multiplayer classroom guessing game. One player secretly receives a name from the class list; others ask YES/NO questions to figure out who it is.

## Features

- 🎭 Real-time multiplayer (up to 28 players)
- ❓ Turn-based YES/NO question system
- 🎯 Searchable name guessing with full class list
- ⏱️ 60-second per-turn timer with auto-skip
- 💬 Real-time chat sidebar
- 🏆 Score tracking across rounds
- 🎉 Confetti win animation
- 📱 Mobile-responsive layout
- 🎨 Hand-drawn notebook aesthetic

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TailwindCSS + Framer Motion |
| Realtime | Socket.IO |
| Backend | FastAPI + Python |
| Deployment | Render (backend) + Vercel/Netlify (frontend) |

---

## Project Structure

```
sketchguess/
├── backend/
│   ├── main.py              # FastAPI + Socket.IO server
│   ├── game_manager.py      # Game state logic
│   ├── rooms.py             # Room & Q&A data models
│   ├── players.py           # Player data model
│   ├── names_pool.py        # 58 names (48 students + 10 teachers)
│   ├── requirements.txt
│   └── render.yaml
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx       # Landing page
    │   │   ├── Host.jsx       # Room creation flow
    │   │   ├── Join.jsx       # Join flow (also handles /room/:code)
    │   │   └── GameRoom.jsx   # Main game screen
    │   ├── components/
    │   │   ├── PlayerSidebar.jsx
    │   │   ├── ChatPanel.jsx
    │   │   ├── Timer.jsx
    │   │   ├── GuessModal.jsx
    │   │   └── QuestionBox.jsx
    │   ├── socket.js
    │   └── App.jsx
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit VITE_BACKEND_URL if needed
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Render (Backend)

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repo
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Note your service URL (e.g. `https://sketchguess.onrender.com`)

### Frontend environment variable

Set `VITE_BACKEND_URL=https://your-render-url.onrender.com` before building.

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create_room` | C→S | Host creates a room |
| `join_room` | C→S | Player joins a room |
| `start_game` | C→S | Host starts the game |
| `ask_question` | C→S | Current player asks a question |
| `answer_question` | C→S | Secret holder answers YES/NO |
| `guess_name` | C→S | Current player guesses the name |
| `next_round` | C→S | Host advances to next round |
| `skip_turn` | C→S | Skip current turn (timeout) |
| `chat_message` | C→S | Send a chat message |
| `room_state` | S→C | Full personalised room state |
| `round_end` | S→C | Round finished event |
| `wrong_guess` | S→C | Incorrect guess notification |

---

## Names Pool (58 total)

**48 Students**: Aarav, Aditya, Akash, Aman, Ananya, Arjun, Arnav, Avni, Ayaan, Bhavya, Chirag, Devansh, Dhruv, Diya, Eshan, Farhan, Gaurav, Ishaan, Ishika, Jatin, Kabir, Kavya, Krish, Lakshmi, Manav, Meera, Mihir, Naman, Neha, Nikhil, Nisha, Om, Parth, Pooja, Pranav, Priya, Rahul, Ranya, Rishi, Rohit, Saanvi, Sahil, Saksham, Shreya, Siddharth, Sneha, Tanvi, Varun

**10 Teachers**: Maths Sir, Physics Sir, Chemistry Ma'am, Biology Ma'am, English Sir, History Ma'am, Geography Sir, Computer Sir, P.E. Sir, Art Ma'am
