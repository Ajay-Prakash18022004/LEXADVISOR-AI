import io
from pathlib import Path
from typing import Tuple, List
from PIL import Image
from app.core.logging import logger

def extract(file_bytes: bytes, filename: str) -> Tuple[str, List[Image.Image]]:
    """
    Extracts text and page images from stamp document bytes (PDF or image).
    """
    text = ""
    images: List[Image.Image] = []
    suffix = Path(filename).suffix.lower()

    try:
        if suffix in [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"]:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            images = [img]
            try:
                import pytesseract
                text = pytesseract.image_to_string(img)
            except Exception:
                text = ""

        elif suffix == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            except Exception as e:
                logger.warning(f"PDF text extraction note: {e}")

            try:
                from pdf2image import convert_from_bytes
                images = convert_from_bytes(file_bytes, first_page=1, last_page=2)
            except Exception:
                pass

        elif suffix in [".txt", ".md"]:
            text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"OCR service extraction error: {e}")

    # Fallback image representation if no image extracted
    if not images:
        fallback_img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
        images = [fallback_img]

    # If text is empty, check if file content has plain text strings
    if not text.strip():
        try:
            raw_str = file_bytes.decode("utf-8", errors="ignore")
            # Filter ascii lines
            lines = [line.strip() for line in raw_str.split("\n") if len(line.strip()) > 4]
            if len(lines) > 2:
                text = "\n".join(lines[:40])
        except Exception:
            pass

    return text.strip(), images
