from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class AnswerKeyService(ABC):
    """
    Abstract interface for automated answer-key generator.
    Will be implemented to generate step-by-step working and answers grounded in slide chunks.
    """

    @abstractmethod
    async def generate_answer_key(
        self,
        question_text: str,
        slide_chunks: List[Dict[str, Any]],
        part: str,
        marks: int
    ) -> Dict[str, Any]:
        """
        Generates answer key and working steps grounded in provided slide chunks.
        Returns dict with keys: 'answer_key', 'working', 'source_refs'.
        """
        pass

class AnswerKeyServiceStub(AnswerKeyService):
    """
    Stub implementation for AnswerKeyService.
    Does not run LLM generation; returns empty/placeholder answer key structure.
    """

    async def generate_answer_key(
        self,
        question_text: str,
        slide_chunks: List[Dict[str, Any]],
        part: str,
        marks: int
    ) -> Dict[str, Any]:
        return {
            "answer_key": None,
            "working": None,
            "source_refs": [
                {
                    "ppt_name": chunk.get("ppt_name"),
                    "slide_no": chunk.get("slide_no"),
                    "chunk_id": chunk.get("id")
                }
                for chunk in (slide_chunks or [])[:3]
            ]
        }
