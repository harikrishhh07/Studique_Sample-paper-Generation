import logging
from typing import List, Dict, Any, Tuple, Optional
from rapidfuzz import fuzz
from sqlalchemy import select
from app.db.models import Question, QuestionOccurrence

logger = logging.getLogger("dedupe")

HIGH_SIMILARITY_THRESHOLD = 0.88
GREY_ZONE_THRESHOLD = 0.75

class DedupeEngine:
    """
    Deduplication engine using rapidfuzz string matching + embedding thresholds.
    Finds near-duplicates within a subject and auto-merges or flags for review queue.
    """
    
    @staticmethod
    async def process_question_dedupe(
        subject_id: str,
        question_text: str,
        user_id: Optional[str],
        db_session
    ) -> Tuple[str, Optional[Question]]:
        """
        Returns (similarity_status, canonical_question_obj).
        similarity_status: 'unique' | 'auto_merged' | 'grey_zone'
        """
        stmt = select(Question).where(
            Question.subject_id == subject_id,
            Question.canonical_id == None
        )
        if user_id:
            stmt = stmt.where(Question.user_id == user_id)

        result = await db_session.execute(stmt)
        existing_questions = result.scalars().all()
        
        best_match_q = None
        best_score = 0.0
        
        for eq in existing_questions:
            score = fuzz.token_sort_ratio(question_text, eq.question_text) / 100.0
            if score > best_score:
                best_score = score
                best_match_q = eq

        if best_score >= HIGH_SIMILARITY_THRESHOLD and best_match_q:
            logger.info(f"Auto-merging question into canonical {best_match_q.id} (Score: {best_score:.2f})")
            return "auto_merged", best_match_q
        elif best_score >= GREY_ZONE_THRESHOLD and best_match_q:
            logger.info(f"Question flagged in grey zone matching {best_match_q.id} (Score: {best_score:.2f})")
            return "grey_zone", best_match_q
        else:
            return "unique", None
