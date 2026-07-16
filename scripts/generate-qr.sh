#!/usr/bin/env bash
# 후원 신청 페이지 QR 생성
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/qr"
URL="${DONATION_URL:-https://fund.dflhs.or.kr}"

mkdir -p "$OUT"

python3 -m pip install -q 'qrcode[pil]' 2>/dev/null || true

python3 - "$OUT" "$URL" << 'PY'
import sys
import qrcode
import qrcode.image.svg
from pathlib import Path

out = Path(sys.argv[1])
url = sys.argv[2]

for name, box, border in [("donation-apply-qr.png", 12, 2), ("donation-apply-qr-print.png", 20, 3)]:
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=box, border=border)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(out / name)
    print(f"✓ {out / name}")

qr_svg = qrcode.QRCode(image_factory=qrcode.image.svg.SvgPathImage, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
qr_svg.add_data(url)
qr_svg.make(fit=True)
svg_path = out / "donation-apply-qr.svg"
with open(svg_path, "wb") as f:
    qr_svg.make_image().save(f)
print(f"✓ {svg_path}")
PY

echo ""
echo "URL: $URL"
echo "인쇄용: $OUT/print-handout.html (브라우저에서 열고 인쇄)"
