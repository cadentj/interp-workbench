from typing import Literal

from pydantic import BaseModel

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class Completion(BaseModel):
    id: str
    prompt: str

