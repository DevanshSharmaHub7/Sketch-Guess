import random
import string
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from players import Player
from names_pool import ALL_NAMES


def generate_room_code(length=5) -> str:
    return "".join(random.choices(string.ascii_uppercase, k=length))


@dataclass
class QA:
    question: str
    asker_name: str   # store player NAME, not ID
    answer: Optional[str] = None  # "YES" | "NO"

    def to_dict(self):
        return {"question": self.question, "asker": self.asker_name, "answer": self.answer}


@dataclass
class Room:
    room_code: str
    host_id: str
    max_players: int = 28
    questions_per_player: int = 2

    players: Dict[str, Player] = field(default_factory=dict)
    player_order: List[str] = field(default_factory=list)

    # Game state
    started: bool = False
    round_number: int = 0
    secret_holder_index: int = 0
    secret_name: Optional[str] = None
    current_turn_index: int = 0
    questions_left: int = 0
    qa_history: List[QA] = field(default_factory=list)
    # phase: lobby | choosing_secret | playing | round_end | game_over
    phase: str = "lobby"
    winner_id: Optional[str] = None

    @property
    def secret_holder_id(self) -> Optional[str]:
        if not self.player_order:
            return None
        idx = self.secret_holder_index % len(self.player_order)
        return self.player_order[idx]

    @property
    def current_turn_id(self) -> Optional[str]:
        if not self.player_order or self.phase != "playing":
            return None
        non_holders = [pid for pid in self.player_order if pid != self.secret_holder_id]
        if not non_holders:
            return None
        idx = self.current_turn_index % len(non_holders)
        return non_holders[idx]

    def begin_round_setup(self):
        """Move to choosing_secret phase — secret holder picks the name."""
        self.qa_history = []
        self.phase = "choosing_secret"
        self.winner_id = None
        self.secret_name = None
        self.current_turn_index = 0
        for pid, player in self.players.items():
            player.is_secret_holder = (pid == self.secret_holder_id)

    def confirm_secret(self, name: str):
        self.secret_name = name
        self.phase = "playing"
        total = self.questions_per_player * max(1, len(self.players) - 1)
        self.questions_left = max(total, 1)

    def advance_turn(self):
        self.current_turn_index += 1
        self.questions_left -= 1
        if self.questions_left <= 0:
            self.phase = "round_end"

    def add_qa(self, question: str, asker_name: str) -> QA:
        qa = QA(question=question, asker_name=asker_name)
        self.qa_history.append(qa)
        return qa

    def answer_latest(self, answer: str):
        if self.qa_history:
            self.qa_history[-1].answer = answer

    def next_round(self):
        self.round_number += 1
        self.secret_holder_index = (self.secret_holder_index + 1) % len(self.player_order)
        self.begin_round_setup()

    def to_dict(self, for_player_id: Optional[str] = None) -> Dict[str, Any]:
        reveal_secret = for_player_id == self.secret_holder_id
        return {
            "room_code": self.room_code,
            "host_id": self.host_id,
            "max_players": self.max_players,
            "questions_per_player": self.questions_per_player,
            "players": {pid: p.to_dict() for pid, p in self.players.items()},
            "player_order": self.player_order,
            "started": self.started,
            "round_number": self.round_number,
            "secret_holder_id": self.secret_holder_id,
            "secret_name": self.secret_name if reveal_secret else None,
            "current_turn_id": self.current_turn_id,
            "questions_left": self.questions_left,
            "qa_history": [qa.to_dict() for qa in self.qa_history],
            "phase": self.phase,
            "winner_id": self.winner_id,
        }