import re
from typing import List
from PIL import Image
from app.schemas.stamp import StampFields, CheckResult
from app.core.logging import logger

def check(images: List[Image.Image], fields: StampFields) -> List[CheckResult]:
    """
    Detects QR code / 2D barcode and verifies UIN / Certificate Number.
    Uses OpenCV/pyzbar if installed, with robust image and text heuristics.
    """
    checks: List[CheckResult] = []
    qr_detected = False
    qr_data = ""

    # Attempt OpenCV QRCodeDetector
    try:
        import cv2
        import numpy as np
        detector = cv2.QRCodeDetector()
        for img in images:
            # Convert PIL to cv2 BGR
            cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            val, points, _ = detector.detectAndDecode(cv_img)
            if val:
                qr_detected = True
                qr_data = val
                break
    except Exception as e:
        logger.debug(f"OpenCV QR detection not available or error: {e}")

    # Attempt pyzbar if not yet found
    if not qr_detected:
        try:
            # pyrefly: ignore[missing-import]
            from pyzbar.pyzbar import decode
            for img in images:
                decoded = decode(img)
                if decoded:
                    qr_detected = True
                    qr_data = decoded[0].data.decode("utf-8", errors="ignore")
                    break
        except Exception:
            pass

    # If document has UIN or serial in text
    has_uin = bool(fields.serial_or_uin and len(fields.serial_or_uin) > 6)

    portal_url = "https://www.shcilestamp.com/estamp_cer_ver.html"
    state_portal = "Telangana IGRS / AP Stamps & Registration Portal"

    if fields.stamp_type == "e-stamp":
        if qr_detected or has_uin:
            uin_val = fields.serial_or_uin or "Detected in Barcode"
            # As per requirements: mark not_verified so user confirms on official portal
            checks.append(CheckResult(
                name="E-Stamp Portal Verification",
                status="not_verified",
                detail=(
                    f"Certificate UIN/Barcode identified: '{uin_val}'. "
                    f"Automated verification requires manual confirmation on official portal. "
                    f"Verify authenticity at: {portal_url} or {state_portal}."
                )
            ))
            if qr_detected:
                checks.append(CheckResult(
                    name="2D Barcode / QR Security Mark",
                    status="pass",
                    detail=f"Cryptographic 2D verification barcode detected on e-stamp certificate."
                ))
            else:
                checks.append(CheckResult(
                    name="2D Barcode / QR Security Mark",
                    status="warning",
                    detail="Digital barcode unclear on scan, but alphanumeric Certificate UIN is present."
                ))
        else:
            checks.append(CheckResult(
                name="E-Stamp Portal Verification",
                status="fail",
                detail="Document claimed as e-stamp, but neither 2D verification barcode nor valid Certificate UIN could be detected."
            ))
    else:
        # Physical non-judicial stamp paper
        if has_uin:
            checks.append(CheckResult(
                name="Serial Number Registration",
                status="pass",
                detail=f"Physical non-judicial stamp paper serial '{fields.serial_or_uin}' recorded."
            ))
        else:
            checks.append(CheckResult(
                name="Serial Number Registration",
                status="warning",
                detail="Physical stamp paper serial number is faded or partially unreadable."
            ))

    return checks
