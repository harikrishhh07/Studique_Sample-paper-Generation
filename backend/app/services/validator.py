from typing import List, Dict, Any, Tuple

class StructureValidator:
    """
    Validates extracted questions against the SRM paper layout config:
    - Part A: 20 questions x 1 mark = 20 Marks
    - Part B: 5 questions x 8 marks = 40 Marks (Q21 to Q25, each with a/b OR choice)
    - Part C: 15 Marks (Q26, Q27, Q28 choices)
    - Total: 75 Marks
    """
    
    @staticmethod
    def validate_extraction(questions: List[Dict[str, Any]], format_config: Dict[str, Any] = None) -> Tuple[bool, List[str]]:
        errors = []
        
        part_a = [q for q in questions if q.get("part") == "A"]
        part_b = [q for q in questions if q.get("part") == "B"]
        part_c = [q for q in questions if q.get("part") == "C"]
        
        # Check Part A count and marks
        if len(part_a) != 20:
            errors.append(f"Part A must contain exactly 20 questions (found {len(part_a)})")
        for q in part_a:
            if q.get("marks") != 1:
                errors.append(f"Part A question {q.get('question_no')} must carry 1 mark (found {q.get('marks')})")

        # Check Part B count and marks
        # Part B should have 10 sub-questions (5 OR pairs: 21.a, 21.b ... 25.a, 25.b)
        if len(part_b) not in (5, 10):
            errors.append(f"Part B must contain 5 main questions (10 OR options total), found {len(part_b)}")
        for q in part_b:
            if q.get("marks") != 8:
                errors.append(f"Part B question {q.get('question_no')} must carry 8 marks (found {q.get('marks')})")

        # Check Part C marks
        for q in part_c:
            if q.get("marks") != 15:
                errors.append(f"Part C question {q.get('question_no')} must carry 15 marks (found {q.get('marks')})")

        is_valid = len(errors) == 0
        return is_valid, errors
