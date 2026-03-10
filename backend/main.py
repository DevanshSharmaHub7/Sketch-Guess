import os
import uuid
import logging

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from game_manager import GameManager
from names_pool import ALL_NAMES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

fastapi_app = FastAPI(title="SketchGuess API")
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
gm = GameManager()


# ── REST ─────────────────────────────────────────────────────────────────────
@fastapi_app.get("/health")
async def health():
    return {"status": "ok", "rooms": len(gm.rooms)}

@fastapi_app.get("/names")
async def get_names():
    return {"names": ALL_NAMES}


# ── Helpers ──────────────────────────────────────────────────────────────────
async def emit_room_state(room):
    """Send personalised room_state to every connected player in the room."""
    for player_id, player in room.players.items():
        for sid, (rc, pid) in list(gm.sid_to_player.items()):
            if rc == room.room_code and pid == player_id:
                await sio.emit(
                    "room_state",
                    room.to_dict(for_player_id=player_id),
                    to=sid,
                )

async def emit_error(sid: str, message: str):
    await sio.emit("error", {"message": message}, to=sid)


# ── Socket events ─────────────────────────────────────────────────────────────
@sio.event
async def connect(sid, environ, auth):
    logger.info(f"Connected: {sid}")

@sio.event
async def disconnect(sid):
    room_code, player_id = gm.disconnect(sid)
    if room_code and player_id:
        room = gm.rooms.get(room_code)
        if room:
            player_name = room.players[player_id].name if player_id in room.players else "Someone"
            await sio.emit(
                "player_disconnected",
                {"player_id": player_id, "player_name": player_name},
                room=room_code,
            )
            await emit_room_state(room)
    logger.info(f"Disconnected: {sid}")


@sio.event
async def create_room(sid, data: dict):
    player_id = data.get("player_id") or str(uuid.uuid4())
    host_name = (data.get("host_name") or "Host").strip()[:30]
    max_players = min(int(data.get("max_players", 28)), 28)
    questions_per_player = max(1, int(data.get("questions_per_player", 2)))

    room = gm.create_room(sid, player_id, host_name, max_players, questions_per_player)
    await sio.enter_room(sid, room.room_code)
    await sio.emit("room_created", {"room_code": room.room_code, "player_id": player_id}, to=sid)
    await emit_room_state(room)


@sio.event
async def join_room(sid, data: dict):
    player_id = data.get("player_id") or str(uuid.uuid4())
    player_name = (data.get("player_name") or "Player").strip()[:30]
    room_code = (data.get("room_code") or "").upper().strip()

    room, err = gm.join_room(sid, player_id, player_name, room_code)
    if err:
        return await emit_error(sid, err)

    await sio.enter_room(sid, room_code)
    # Always confirm join back to caller (GameRoom uses this to confirm reconnect)
    await sio.emit("joined_room", {"room_code": room_code, "player_id": player_id}, to=sid)
    # Notify others only if this is a fresh join (not a reconnect)
    player = room.players.get(player_id)
    await sio.emit(
        "player_joined",
        {"player": player.to_dict() if player else {}},
        room=room_code,
        skip_sid=sid,
    )
    await emit_room_state(room)


@sio.event
async def start_game(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        logger.warning(f"start_game: no room for sid {sid}")
        return await emit_error(sid, "Not in a room — try refreshing")
    room_code, player_id = info
    room = gm.start_game(room_code, player_id)
    if not room:
        return await emit_error(sid, "Only the host can start the game")
    logger.info(f"Game started in room {room_code} by {player_id}")
    await sio.emit("game_started", {"round": room.round_number}, room=room_code)
    await emit_room_state(room)


@sio.event
async def choose_secret(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return await emit_error(sid, "Not in a room")
    room_code, player_id = info
    secret_name = (data.get("secret_name") or "").strip()

    room, err = gm.choose_secret(room_code, player_id, secret_name)
    if err:
        return await emit_error(sid, err)

    await sio.emit("secret_chosen", {"secret_holder_id": player_id}, room=room_code)
    await emit_room_state(room)


@sio.event
async def ask_question(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return await emit_error(sid, "Not in a room")
    room_code, player_id = info
    question = (data.get("question") or "").strip()[:200]
    if not question:
        return await emit_error(sid, "Question cannot be empty")

    room, qa = gm.ask_question(room_code, player_id, question)
    if not room:
        return await emit_error(sid, qa)

    await sio.emit("question_asked", {"qa": qa.to_dict(), "asker_id": player_id}, room=room_code)
    await emit_room_state(room)


@sio.event
async def answer_question(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return await emit_error(sid, "Not in a room")
    room_code, player_id = info
    answer = (data.get("answer") or "").upper().strip()

    room, err = gm.answer_question(room_code, player_id, answer)
    if not room:
        return await emit_error(sid, err)

    await sio.emit("question_answered", {"answer": answer, "phase": room.phase}, room=room_code)
    if room.phase == "round_end":
        await sio.emit(
            "round_end",
            {"winner_id": room.winner_id, "secret_name": room.secret_name, "reason": "out_of_questions"},
            room=room_code,
        )
    await emit_room_state(room)


@sio.event
async def guess_name(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return await emit_error(sid, "Not in a room")
    room_code, player_id = info
    guess = (data.get("guess") or "").strip()

    room, correct = gm.guess_name(room_code, player_id, guess)
    if not room:
        return await emit_error(sid, correct)

    if correct:
        await sio.emit(
            "round_end",
            {"winner_id": player_id, "secret_name": room.secret_name, "reason": "correct_guess", "guess": guess},
            room=room_code,
        )
    else:
        await sio.emit("wrong_guess", {"player_id": player_id, "guess": guess}, room=room_code)
    await emit_room_state(room)


@sio.event
async def next_round(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return await emit_error(sid, "Not in a room")
    room_code, player_id = info
    room = gm.next_round(room_code, player_id)
    if not room:
        return await emit_error(sid, "Cannot advance round")
    await sio.emit("round_started", {"round": room.round_number}, room=room_code)
    await emit_room_state(room)


@sio.event
async def skip_turn(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return
    room_code, player_id = info
    room = gm.rooms.get(room_code)
    if not room or room.phase != "playing":
        return
    if player_id not in (room.host_id, room.current_turn_id):
        return
    room.advance_turn()
    await sio.emit("turn_skipped", {"skipped_player_id": player_id}, room=room_code)
    if room.phase == "round_end":
        await sio.emit(
            "round_end",
            {"winner_id": None, "secret_name": room.secret_name, "reason": "out_of_questions"},
            room=room_code,
        )
    await emit_room_state(room)


@sio.event
async def chat_message(sid, data: dict):
    info = gm.get_room_for_sid(sid)
    if not info:
        return
    room_code, player_id = info
    message = (data.get("message") or "").strip()[:300]
    if not message:
        return
    result = gm.chat_message(room_code, player_id, message)
    if not result:
        return
    room, msg = result
    await sio.emit("chat_message", msg, room=room_code)