import os
import base64
import uuid
import fitz  # PyMuPDF
from typing import List, Dict, Any, Tuple

class PDFProcessor:
    """
    Renders PDF pages to 200 DPI images, detects text layers, and crops figures.
    """
    
    @staticmethod
    def detect_text_layer(pdf_path: str) -> bool:
        """Check if PDF has embedded text layer."""
        try:
            doc = fitz.open(pdf_path)
            total_text = ""
            for page in doc:
                total_text += page.get_text()
            doc.close()
            return len(total_text.strip()) > 50
        except Exception:
            return False

    @staticmethod
    def render_pages_to_images(pdf_path: str, dpi: int = 200) -> List[Tuple[int, str, str]]:
        """
        Renders each page of PDF at `dpi` resolution.
        Returns list of (page_num, page_text_layer, base64_image_str).
        """
        doc = fitz.open(pdf_path)
        pages_data = []
        zoom = dpi / 72.0  # 72 is standard PDF point size
        matrix = fitz.Matrix(zoom, zoom)
        
        for i, page in enumerate(doc):
            text = page.get_text()
            pix = page.get_pixmap(matrix=matrix)
            img_bytes = pix.tobytes("png")
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            pages_data.append((i + 1, text, img_b64))
            
        doc.close()
        return pages_data

    @staticmethod
    def crop_figure(pdf_path: str, page_num: int, bbox: List[float], output_dir: str = "uploads/figures") -> str:
        """
        Crop a figure bounding box [ymin, xmin, ymax, xmax] (normalized 0..1 or rect coordinates)
        on `page_num` (1-based index) and save to disk. Returns relative figure file reference path.
        """
        os.makedirs(output_dir, exist_ok=True)
        doc = fitz.open(pdf_path)
        if page_num < 1 or page_num > len(doc):
            doc.close()
            return ""
            
        page = doc[page_num - 1]
        rect_page = page.rect
        
        ymin, xmin, ymax, xmax = bbox
        if max(bbox) <= 1.0:
            crop_rect = fitz.Rect(
                xmin * rect_page.width,
                ymin * rect_page.height,
                xmax * rect_page.width,
                ymax * rect_page.height
            )
        else:
            crop_rect = fitz.Rect(xmin, ymin, xmax, ymax)
            
        pix = page.get_pixmap(clip=crop_rect, dpi=200)
        fig_id = f"fig_p{page_num}_{uuid.uuid4().hex[:8]}.png"
        fig_path = os.path.join(output_dir, fig_id)
        pix.save(fig_path)
        doc.close()
        return fig_path
