import re

def clean_extracted_text(text: str) -> str:
    """Removes excessive whitespace, null bytes, and normalizes line breaks."""
    if not text:
        return ""
    text = text.replace('\x00', '')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def mask_pii(text: str) -> str:
    """Basic helper to mask phone numbers and PAN/Aadhaar numbers for privacy."""
    # Mask Indian mobile numbers
    text = re.sub(r'\b[6-9]\d{9}\b', '[REDACTED_PHONE]', text)
    # Mask Aadhaar numbers (12 digits)
    text = re.sub(r'\b\d{4}\s\d{4}\s\d{4}\b', '[REDACTED_AADHAAR]', text)
    # Mask PAN numbers
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', '[REDACTED_PAN]', text)
    return text
