let html5QrScanner = null;
let isScanning = false;

function startCamera() {
  const laser = document.getElementById("laser-line");

  if (!html5QrScanner) {
    html5QrScanner = new Html5Qrcode("qr-reader");
  }

  const config = {
    fps: 15,
    qrbox: { width: 230, height: 230 }
  };

  html5QrScanner.start(
    { facingMode: "environment" },
    config,
    onScanSuccess,
    () => {}
  ).then(() => {
    isScanning = true;
    if (laser) laser.style.display = "block";
  }).catch((err) => {
    console.error("Camera access failed", err);
    alert("Camera permission ivvandi leda Image Upload option use cheyandi.");
  });
}

function stopCamera() {
  if (html5QrScanner && isScanning) {
    html5QrScanner.stop().then(() => {
      isScanning = false;
      const laser = document.getElementById("laser-line");
      if (laser) laser.style.display = "none";
    });
  }
}

const toggleBtn = document.getElementById("btn-toggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (isScanning) stopCamera();
    else startCamera();
  });
}

const fileInput = document.getElementById("qr-image-input");
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!html5QrScanner) {
      html5QrScanner = new Html5Qrcode("qr-reader");
    }

    html5QrScanner.scanFile(file, true)
      .then((decodedText) => {
        onScanSuccess(decodedText);
      })
      .catch(() => {
        alert("Image lo QR code dorakaledhu. Clear photo upload cheyandi.");
      });
  });
}

function onScanSuccess(decodedText) {
  playBeep();
  renderStudentCard(decodedText);
}

function renderStudentCard(rawText) {
  const content = rawText.trim();
  const imgTarget = document.getElementById("scanned-image");
  const idleBox = document.getElementById("idle-box");
  const resultBox = document.getElementById("result-box");
  const timeVal = document.getElementById("scan-time-val");

  if (idleBox) idleBox.style.display = "none";
  if (resultBox) resultBox.style.display = "flex";

  const now = new Date();
  timeVal.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  let extractedPhoto = "";

  // Base64 image decode from ?card= parameter
  if (content.includes("card=")) {
    try {
      const urlObj = new URL(content);
      const encodedParam = urlObj.searchParams.get("card");
      if (encodedParam) {
        extractedPhoto = atob(encodedParam);
      }
    } catch (e) {
      const paramPart = content.split("card=")[1];
      if (paramPart) {
        try {
          extractedPhoto = atob(paramPart.split("&")[0]);
        } catch (err) {}
      }
    }
  }

  // Direct Image check
  if (!extractedPhoto) {
    if (content.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || content.startsWith("data:image/")) {
      extractedPhoto = content;
    }
  }

  // JSON format check
  if (!extractedPhoto) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.photo || parsed.image || parsed.card) {
        extractedPhoto = parsed.photo || parsed.image || parsed.card;
      }
    } catch (e) {}
  }

  // Key:Value image check
  if (!extractedPhoto) {
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
      if (line.includes(":") || line.includes("=")) {
        const parts = line.includes(":") ? line.split(":") : line.split("=");
        const k = parts[0].trim().toLowerCase();
        const v = parts.slice(1).join(":").trim();
        if (k === "image" || k === "photo") {
          extractedPhoto = v;
        }
      }
    });
  }

  if (extractedPhoto) {
    imgTarget.src = extractedPhoto;
  } else {
    imgTarget.src = content;
  }
}

function handleImageFallback(img) {
  img.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";
}

function resetScannerView() {
  const resultBox = document.getElementById("result-box");
  const idleBox = document.getElementById("idle-box");
  if (resultBox) resultBox.style.display = "none";
  if (idleBox) idleBox.style.display = "block";

  if (!isScanning) {
    startCamera();
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 940;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {}
}

window.addEventListener("DOMContentLoaded", () => {
  startCamera();
});