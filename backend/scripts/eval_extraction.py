import sys
import os
import re
import json
from typing import Dict, Any, List
from rapidfuzz import fuzz

def extract_latex(text: str) -> List[str]:
    """Find all $...$ inline LaTeX expressions in text."""
    return re.findall(r'\$(.*?)\$', text)

def evaluate_extraction(pred_json_path: str, gold_json_path: str) -> Dict[str, Any]:
    with open(pred_json_path, 'r') as f:
        pred_data = json.load(f)
    with open(gold_json_path, 'r') as f:
        gold_data = json.load(f)

    pred_questions = pred_data.get("questions", [])
    gold_questions = gold_data.get("questions", [])

    total_gold = len(gold_questions)
    if total_gold == 0:
        return {"error": "Gold set contains 0 questions"}

    text_scores = []
    meta_matches = 0
    math_scores = []

    for gq in gold_questions:
        g_text = gq.get("question_text", "")
        g_marks = gq.get("marks")
        g_bl = gq.get("bl")
        g_co = gq.get("co")
        g_po = gq.get("po")
        g_latex = extract_latex(g_text)

        best_match_pq = None
        best_score = 0
        for pq in pred_questions:
            score = fuzz.token_sort_ratio(g_text, pq.get("question_text", ""))
            if score > best_score:
                best_score = score
                best_match_pq = pq

        text_scores.append(best_score)

        if best_match_pq:
            # Metadata accuracy
            if (
                best_match_pq.get("marks") == g_marks and
                best_match_pq.get("bl") == g_bl and
                best_match_pq.get("co") == g_co and
                best_match_pq.get("po") == g_po
            ):
                meta_matches += 1

            # Math / LaTeX accuracy
            p_text = best_match_pq.get("question_text", "")
            p_latex = extract_latex(p_text)
            if not g_latex:
                math_scores.append(100.0)
            else:
                math_match_count = 0
                for gl in g_latex:
                    if any(fuzz.ratio(gl, pl) > 85 for pl in p_latex):
                        math_match_count += 1
                math_scores.append((math_match_count / len(g_latex)) * 100.0)

    avg_text_acc = sum(text_scores) / len(text_scores) if text_scores else 0.0
    meta_acc = (meta_matches / total_gold) * 100.0 if total_gold else 0.0
    avg_math_acc = sum(math_scores) / len(math_scores) if math_scores else 0.0

    report = {
        "gold_questions_count": total_gold,
        "pred_questions_count": len(pred_questions),
        "text_accuracy": round(avg_text_acc, 2),
        "metadata_accuracy": round(meta_acc, 2),
        "math_latex_accuracy": round(avg_math_acc, 2),
        "overall_score": round((avg_text_acc * 0.4 + meta_acc * 0.3 + avg_math_acc * 0.3), 2)
    }

    return report

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python eval_extraction.py <pred_json> <gold_json>")
        sys.exit(1)

    pred_path = sys.argv[1]
    gold_path = sys.argv[2]
    
    if not os.path.exists(pred_path) or not os.path.exists(gold_path):
        print("Error: JSON file paths do not exist")
        sys.exit(1)

    results = evaluate_extraction(pred_path, gold_path)
    print("\n--- EXTRACTION EVALUATION REPORT ---")
    print(json.dumps(results, indent=2))
