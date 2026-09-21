import pytest
from app.services.blueprint import BlueprintSampler
from app.services.validator import StructureValidator
from app.services.ppt_parser import parse_unit_number

def test_parse_unit_number():
    assert parse_unit_number("Unit 1 - Calculus.pptx") == 1
    assert parse_unit_number("Chapter 3 notes.pptx") == 3
    assert parse_unit_number("Module IV - Vector Spaces.ppt") == 4
    assert parse_unit_number("Random title") == 0

def test_blueprint_sampler():
    units = [
        {"id": "u1", "unit_no": 1, "title": "Unit 1"},
        {"id": "u2", "unit_no": 2, "title": "Unit 2"},
        {"id": "u3", "unit_no": 3, "title": "Unit 3"},
        {"id": "u4", "unit_no": 4, "title": "Unit 4"},
        {"id": "u5", "unit_no": 5, "title": "Unit 5"}
    ]
    bp = BlueprintSampler.sample_blueprint(units)
    assert bp["total_marks"] == 75
    slots = bp["slots"]
    assert len(slots) == 33 # 20 Part A + 10 Part B + 3 Part C

    part_a = [s for s in slots if s["part"] == "A"]
    part_b = [s for s in slots if s["part"] == "B"]
    part_c = [s for s in slots if s["part"] == "C"]

    assert len(part_a) == 20
    assert len(part_b) == 10
    assert len(part_c) == 3

def test_structure_validator():
    questions = []
    for i in range(1, 21):
        questions.append({"part": "A", "question_no": i, "marks": 1})
    for i in range(21, 26):
        questions.append({"part": "B", "question_no": i, "or_group": f"{i}.a", "marks": 8})
        questions.append({"part": "B", "question_no": i, "or_group": f"{i}.b", "marks": 8})
    questions.append({"part": "C", "question_no": 27, "marks": 15})

    is_valid, errors = StructureValidator.validate_extraction(questions)
    assert is_valid is True
    assert len(errors) == 0
