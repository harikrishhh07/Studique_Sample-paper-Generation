import random
from typing import List, Dict, Any

class BlueprintSampler:
    """
    Computes blueprint in Python code (NOT by LLM) based on SRM Format config:
    - Part A: 20 slots (Q1 to Q20, 1 mark each, distributed across Units 1 to 5)
    - Part B: 10 slots (Q21a, Q21b to Q25a, Q25b; 8 marks each, 2 slots per Unit)
    - Part C: 3 slots (Q26, Q27, Q28; 15 marks each, choice of 1)
    - Total Marks = 75
    """
    
    @staticmethod
    def sample_blueprint(syllabus_units: List[Dict[str, Any]]) -> Dict[str, Any]:
        unit_ids = [u["id"] for u in syllabus_units] if syllabus_units else [f"unit_{i}" for i in range(1, 6)]
        num_units = len(unit_ids) if len(unit_ids) > 0 else 5

        slots = []

        # 1. Part A (20 slots, 1 mark each, 4 per unit)
        for i in range(1, 21):
            unit_idx = (i - 1) % num_units
            target_unit = unit_ids[unit_idx]
            bl = (i % 3) + 1
            co = (unit_idx % 5) + 1
            slots.append({
                "slot_id": f"A_{i}",
                "part": "A",
                "question_no": i,
                "or_group": None,
                "marks": 1,
                "unit_id": target_unit,
                "unit_no": unit_idx + 1,
                "bl": bl,
                "co": co,
                "po": 1
            })

        # 2. Part B (5 OR pairs = 10 slots, 8 marks each, 2 per unit)
        q_num = 21
        for u_idx in range(5):
            target_unit = unit_ids[u_idx % num_units]
            # Option a
            slots.append({
                "slot_id": f"B_{q_num}_a",
                "part": "B",
                "question_no": q_num,
                "or_group": f"{q_num}.a",
                "sub_no": "a",
                "marks": 8,
                "unit_id": target_unit,
                "unit_no": (u_idx % num_units) + 1,
                "bl": 3,
                "co": (u_idx % 5) + 1,
                "po": 2
            })
            # Option b
            slots.append({
                "slot_id": f"B_{q_num}_b",
                "part": "B",
                "question_no": q_num,
                "or_group": f"{q_num}.b",
                "sub_no": "b",
                "marks": 8,
                "unit_id": target_unit,
                "unit_no": (u_idx % num_units) + 1,
                "bl": 3,
                "co": (u_idx % 5) + 1,
                "po": 2
            })
            q_num += 1

        # 3. Part C (3 slots, 15 marks each)
        for i, q_c in enumerate([26, 27, 28]):
            target_unit = unit_ids[i % num_units]
            slots.append({
                "slot_id": f"C_{q_c}",
                "part": "C",
                "question_no": q_c,
                "or_group": None,
                "marks": 15,
                "unit_id": target_unit,
                "unit_no": (i % num_units) + 1,
                "bl": 4,
                "co": (i % 5) + 1,
                "po": 3
            })

        return {
            "format": "srm-standard-v1",
            "total_marks": 75,
            "unit_distribution": {
                f"Unit {u+1}": "4x Part A (4m) + 2x Part B (16m) + Part C option" for u in range(5)
            },
            "slots": slots
        }
