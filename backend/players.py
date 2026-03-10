import random
from dataclasses import dataclass, field
from typing import Optional

AVATARS = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐙","🦋","🐢","🦄","🐝","🦊","🐺","🦝","🦧","🦊","🐳","🦈","🐬","🦜"]

@dataclass
class Player:
    id: str
    name: str
    avatar: str = field(default_factory=lambda: random.choice(AVATARS))
    score: int = 0
    is_secret_holder: bool = False
    connected: bool = True

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "avatar": self.avatar,
            "score": self.score,
            "is_secret_holder": self.is_secret_holder,
            "connected": self.connected,
        }
