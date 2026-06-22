"""Pydantic request/response schemas — the public API contract."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


# ---- Documents ----
class IngestResponse(BaseModel):
    indexed: list[str] = Field(default_factory=list)  # filenames successfully indexed
    errors: list[str] = Field(default_factory=list)


class DocumentInfo(BaseModel):
    filename: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo] = Field(default_factory=list)


class DeleteResponse(BaseModel):
    deleted: str
    removed_chunks: int


# ---- Chat ----
class ChatTurn(BaseModel):
    role: Role
    content: str = Field(max_length=8000)


class Source(BaseModel):
    id: int  # reference number used in the answer text, e.g. [1]
    filename: str
    page: int
    snippet: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=50)


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    grounded: bool
