import base64
from io import BytesIO
import threading
import webbrowser
import cv2
from flask import Flask, jsonify, render_template, request
import numpy as np
import qrcode

app = Flask(__name__)


@app.route("/")
def index():
  return render_template("qr.html")


# 1. Image nundi QR Data Decode Cheyadam (Image to QR)
@app.route("/decode_qr", methods=["POST"])
def decode_qr():
  try:
    if "image" not in request.files:
      return jsonify({"error": "Image file select cheyandi!"}), 400

    file = request.files["image"]
    img_bytes = file.read()

    # Byte stream ni OpenCV image ga marchadam
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # OpenCV QR Code Detector
    detector = cv2.QRCodeDetector()
    data, bbox, _ = detector.detectAndDecode(img)

    if data:
      return jsonify({"status": "success", "decoded_data": data})
    else:
      return (
          jsonify({
              "error": (
                  "Ee image lo valid QR code dorakaledhu! Clear photo upload"
                  " cheyandi."
              )
          }),
          400,
      )

  except Exception as e:
    return jsonify({"error": f"Error: {str(e)}"}), 500


# 2. Text to QR Code Generator
@app.route("/generate_qr", methods=["POST"])
def generate_qr():
  try:
    req_data = request.get_json(silent=True)
    text = req_data.get("text", "").strip() if req_data else ""

    if not text:
      return jsonify({"error": "Text enter cheyandi!"}), 400

    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return jsonify({"status": "success", "qr_image": base64_str})
  except Exception as e:
    return jsonify({"error": str(e)}), 500


def open_browser():
  webbrowser.open_new("http://127.0.0.1:5000/")


if __name__ == "__main__":
  threading.Timer(1.2, open_browser).start()
  app.run(host="127.0.0.1", port=5000, debug=False)