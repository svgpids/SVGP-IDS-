import qrcode
import os

student_id = "2026ECE001"

url = f"https://svgpids.github.io/SVGP-IDS-/scan.html?pin={student_id}"

os.makedirs("qr_codes", exist_ok=True)

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4
)

qr.add_data(url)
qr.make(fit=True)

qr_image = qr.make_image(
    fill_color="black",
    back_color="white"
)

qr_image.save(f"qr_codes/{student_id}.png")

print("QR Created Successfully!")
print(url)