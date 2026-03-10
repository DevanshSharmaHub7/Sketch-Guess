from typing import Dict, Optional
from rooms import Room, generate_room_code
from players import Player


class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.sid_to_player: Dict[str, tuple] = {}  # sid -> (room_code, player_id)

    def create_room(self, sid: str, player_id: str, host_name: str, max_players: int, questions_per_player: int) -> Room:
        code = generate_room_code()
        while code in self.rooms:
            code = generate_room_code()
        host = Player(id=player_id, name=host_name)
        room = Room(room_code=code, host_id=player_id, max_players=max_players, questions_per_player=questions_per_player)
        room.players[player_id] = host
        room.player_order.append(player_id)
        self.rooms[code] = room
        self.sid_to_player[sid] = (code, player_id)
        return room

    def join_room(self, sid: str, player_id: str, player_name: str, room_code: str) -> Optional[tuple]:
        room = self.rooms.get(room_code)
        if not room:
            return None, "Room not found"
        if room.started and player_id not in room.players:
            return None, "Game already started"
        if len(room.players) >= room.max_players and player_id not in room.players:
            return None, "Room is full"
        if player_id not in room.players:
            player = Player(id=player_id, name=player_name)
            room.players[player_id] = player
            room.player_order.append(player_id)
        else:
            room.players[player_id].connected = True
        self.sid_to_player[sid] = (room_code, player_id)
        return room, None

    def start_game(self, room_code: str, requester_id: str) -> Optional[Room]:
        room = self.rooms.get(room_code)
        if not room or room.host_id != requester_id:
            return None
        room.started = True
        room.round_number = 1
        room.begin_round_setup()
        return room
    
    def choose_secret(self, room_code: str, player_id: str, secret_name: str) -> tuple:
        room = self.rooms.get(room_code)
        if not room:
            return None, "Room not found"
        if room.phase != "choosing_secret":
            return None, "Not in secret selection phase"
        if room.secret_holder_id != player_id:
            return None, "Only the secret holder can choose"
        if not secret_name.strip():
            return None, "Name cannot be empty"
        room.confirm_secret(secret_name.strip())
        return room, None

    def ask_question(self, room_code: str, player_id: str, question: str):
        room = self.rooms.get(room_code)
        if not room or room.phase != "playing":
            return None, "Invalid state"
        if room.current_turn_id != player_id:
            return None, "Not your turn"
        qa = room.add_qa(question, player_id)
        return room, qa

    def answer_question(self, room_code: str, player_id: str, answer: str):
        room = self.rooms.get(room_code)
        if not room or room.phase != "playing":
            return None, "Invalid state"
        if room.secret_holder_id != player_id:
            return None, "Only secret holder can answer"
        if answer not in ("YES", "NO"):
            return None, "Answer must be YES or NO"
        room.answer_latest(answer)
        room.advance_turn()
        return room, None

    def guess_name(self, room_code: str, player_id: str, guess: str):
        room = self.rooms.get(room_code)
        if not room or room.phase != "playing":
            return None, "Invalid state"
        if room.current_turn_id != player_id:
            return None, "Not your turn"
        correct = guess.strip().lower() == (room.secret_name or "").strip().lower()
        if correct:
            room.winner_id = player_id
            room.players[player_id].score += 1
            room.phase = "round_end"
        else:
            room.advance_turn()
        return room, correct

    def next_round(self, room_code: str, requester_id: str):
        room = self.rooms.get(room_code)
        if not room or room.host_id != requester_id:
            return None
        room.next_round()
        return room

    def chat_message(self, room_code: str, player_id: str, message: str):
        room = self.rooms.get(room_code)
        if not room:
            return None
        player = room.players.get(player_id)
        if not player:
            return None
        msg = {
            "player_id": player_id,
            "player_name": player.name,
            "avatar": player.avatar,
            "message": message,
        }
        # NOT stored in room — just returned to broadcast
        return room, msg

    def disconnect(self, sid: str):
        info = self.sid_to_player.pop(sid, None)
        if not info:
            return None, None
        room_code, player_id = info
        room = self.rooms.get(room_code)
        if room and player_id in room.players:
            room.players[player_id].connected = False
        return room_code, player_id

    def get_room_for_sid(self, sid: str) -> Optional[tuple]:
        return self.sid_to_player.get(sid)