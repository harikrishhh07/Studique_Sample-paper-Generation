import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from jinja2 import Template
from playwright.async_api import async_playwright

# Local KaTeX fallback / bundled assets
KATEX_CSS_PATH = os.path.join(os.path.dirname(__file__), "..", "vendor", "katex", "katex.min.css")
KATEX_JS_PATH = os.path.join(os.path.dirname(__file__), "..", "vendor", "katex", "katex.min.js")
AUTO_RENDER_JS_PATH = os.path.join(os.path.dirname(__file__), "..", "vendor", "katex", "auto-render.min.js")

def load_local_asset(path: str) -> str:
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception:
        pass
    return ""

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{{ title }}</title>
<style>
  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #111;
    margin: 0;
    padding: 0;
    background: #fff;
    font-size: 13px;
    line-height: 1.5;
  }
  /* Watermark Layer */
  .watermark {
    position: fixed;
    top: 35%;
    left: 5%;
    width: 90%;
    text-align: center;
    font-size: 42px;
    font-weight: 900;
    color: rgba(242, 107, 58, 0.10);
    text-transform: uppercase;
    transform: rotate(-30deg);
    pointer-events: none;
    z-index: 9999;
    letter-spacing: 6px;
  }
  .header-box {
    border: 1.5px solid #000;
    padding: 12px;
    text-align: center;
    margin-bottom: 20px;
    position: relative;
  }
  .header-title {
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header-sub {
    font-size: 13px;
    font-weight: bold;
    margin-top: 4px;
  }
  .reg-grid {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 8px;
  }
  .reg-box {
    border: 1px solid #000;
    width: 18px;
    height: 20px;
    display: inline-block;
    margin-left: 2px;
  }
  .unit-title {
    font-size: 14px;
    font-weight: bold;
    background: #f8f8f8;
    padding: 6px 10px;
    border-left: 4px solid #F26B3A;
    margin-top: 18px;
    margin-bottom: 10px;
  }
  .part-header {
    font-size: 13px;
    font-weight: bold;
    text-align: center;
    margin-top: 15px;
    margin-bottom: 10px;
    text-transform: uppercase;
    border-bottom: 1.5px solid #000;
    padding-bottom: 4px;
  }
  .question-item {
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .q-number {
    font-weight: bold;
    display: inline-block;
    width: 28px;
    vertical-align: top;
  }
  .q-text {
    display: inline-block;
    width: calc(100% - 140px);
  }
  .meta-tag {
    float: right;
    font-size: 10px;
    color: #555;
    font-weight: bold;
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 6px;
    margin-left: 28px;
    font-size: 12.5px;
  }
  .occurrence-badge {
    font-size: 10px;
    background: #fff0eb;
    color: #d94814;
    border: 1px solid #fca582;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    margin-left: 28px;
    display: inline-block;
  }
  .footer-disclaimer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    text-align: center;
    font-size: 10px;
    color: #777;
  }
  .blueprint-box {
    margin-top: 25px;
    padding: 12px;
    border: 1px dashed #aaa;
    background: #fafafa;
    border-radius: 6px;
    page-break-before: always;
  }
  .blueprint-title {
    font-size: 13px;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 8px;
    color: #F26B3A;
  }
  {{ katex_css | safe }}
</style>
<script>
{{ katex_js | safe }}
</script>
<script>
{{ auto_render_js | safe }}
</script>
</head>
<body>
  <!-- Watermark Layer -->
  <div class="watermark">Studique Practice Paper - Unofficial</div>

  <!-- Header -->
  <div class="header-box">
    <div class="reg-grid">
      <span style="font-size: 11px; font-weight: bold; margin-right: 6px;">Register No.</span>
      {% for _ in range(12) %}<span class="reg-box"></span>{% endfor %}
    </div>
    <div class="header-title">SRM Institute of Science and Technology</div>
    <div class="header-sub">{{ subject_code }} — {{ subject_name }}</div>
    <div style="font-size: 11px; margin-top: 4px; color: #444;">{{ paper_type }} | Max. Marks: {{ max_marks }}</div>
  </div>

  <!-- Content -->
  {% for group in groups %}
    {% if group.unit_title %}
      <div class="unit-title">{{ group.unit_title }}</div>
    {% endif %}
    
    {% if group.part_name %}
      <div class="part-header">{{ group.part_name }}</div>
    {% endif %}

    {% for q in group.questions %}
      <div class="question-item">
        <span class="meta-tag">Marks: {{ q.marks }} | BL: {{ q.bl }} | CO: {{ q.co }}</span>
        <span class="q-number">{{ q.question_no }}.</span>
        <span class="q-text">{{ q.question_text }}</span>

        {% if q.options %}
          <div class="options-grid">
            <div>(A) {{ q.options.A }}</div>
            <div>(B) {{ q.options.B }}</div>
            <div>(C) {{ q.options.C }}</div>
            <div>(D) {{ q.options.D }}</div>
          </div>
        {% endif %}

        {% if q.occurrences_text %}
          <div>
            <span class="occurrence-badge">Appeared in: {{ q.occurrences_text }}</span>
          </div>
        {% endif %}
      </div>
    {% endfor %}
  {% endfor %}

  {% if blueprint_summary %}
    <div class="blueprint-box">
      <div class="blueprint-title">Marks & Blueprint Summary Page</div>
      <p style="font-size: 11px; color: #555; margin-bottom: 8px;">Unit coverage distribution and Bloom's taxonomy mapping:</p>
      <ul style="font-size: 11px; padding-left: 20px; margin: 0;">
        {% for unit, desc in blueprint_summary.items() %}
          <li><strong>{{ unit }}:</strong> {{ desc }}</li>
        {% endfor %}
      </ul>
    </div>
  {% endif %}

  <!-- Footer Disclaimer -->
  <div class="footer-disclaimer">
    Disclaimer: This paper is student-generated for practice purposes and is not an official examination paper issued by SRMIST. Generated by Studique.
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
          ]
        });
      }
    });
  </script>
</body>
</html>
"""

class PDFRenderer:
    @staticmethod
    async def render_pdf_from_html(html_content: str, output_pdf_path: str) -> str:
        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_content(html_content, wait_until="load")
            await page.wait_for_timeout(300)
            await page.pdf(
                path=output_pdf_path,
                format="A4",
                print_background=True,
                margin={"top": "15mm", "bottom": "20mm", "left": "15mm", "right": "15mm"}
            )
            await browser.close()
            
        return output_pdf_path

    @staticmethod
    def generate_html_content(
        title: str,
        subject_code: str,
        subject_name: str,
        paper_type: str,
        groups: List[Dict[str, Any]],
        max_marks: int = 75,
        blueprint_summary: Optional[Dict[str, str]] = None
    ) -> str:
        katex_css = load_local_asset(KATEX_CSS_PATH)
        katex_js = load_local_asset(KATEX_JS_PATH)
        auto_render_js = load_local_asset(AUTO_RENDER_JS_PATH)

        template = Template(HTML_TEMPLATE)
        return template.render(
            title=title,
            subject_code=subject_code,
            subject_name=subject_name,
            paper_type=paper_type,
            groups=groups,
            max_marks=max_marks,
            blueprint_summary=blueprint_summary,
            katex_css=katex_css,
            katex_js=katex_js,
            auto_render_js=auto_render_js
        )
