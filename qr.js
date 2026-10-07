// ImgBB API Key
const IMGBB_API_KEY = "3e30b3e79091a80ad92c442851cef6aa";

// DOM Elements
const fileInput = document.getElementById("fileInput");
const selectBtn = document.getElementById("selectBtn");
const dropZone = document.getElementById("dropZone");
const uploadStatus = document.getElementById("uploadStatus");
const qrcodeBox = document.getElementById("qrcodeBox");
const qrStatusText = document.getElementById("qrStatusText");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const liveDateTime = document.getElementById("liveDateTime");

let currentUploadedUrl = "";

// 1. Live Date & Time Updater (Like the UI Header)
function updateClock() {
  const now = new Date();
  const optionsDate = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  const dateStr = now.toLocaleDateString('en-GB', optionsDate);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true });

  if (liveDateTime) {
    liveDateTime.innerHTML = `${dateStr}<br>${timeStr}`;
  }
}
setInterval(updateClock, 1000);
updateClock();

// 2. File Selection & Drag-and-Drop Triggers
selectBtn.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleFileUpload(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

// 3. Upload to ImgBB and Render QR Code
async function handleFileUpload(file) {
  // File size validation (Max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    setStatus("File size exceeds 5MB limit. Please choose a smaller image.", "#ef4444");
    return;
  }

  setStatus("Uploading image to cloud storage...", "#6366f1");
  qrStatusText.innerText = "Processing QR...";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      currentUploadedUrl = result.data.url;

      setStatus("Image uploaded successfully!", "#10b981");
      qrStatusText.innerText = "Your QR code is ready!";

      // Generate QR Code
      qrcodeBox.innerHTML = "";
      new QRCode(qrcodeBox, {
        text: currentUploadedUrl,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      downloadBtn.removeAttribute("disabled");
    } else {
      setStatus("Upload failed: " + (result.error ? result.error.message : "Try again"), "#ef4444");
      qrStatusText.innerText = "Generation failed.";
    }
  } catch (error) {
    console.error(error);
    setStatus("Network error while connecting to server.", "#ef4444");
    qrStatusText.innerText = "Connection error.";
  }
}

function setStatus(text, color) {
  uploadStatus.innerText = text;
  uploadStatus.style.color = color;
}

// 4. Download QR Code as PNG
downloadBtn.addEventListener("click", () => {
  const qrImg = qrcodeBox.querySelector("img");
  const qrCanvas = qrcodeBox.querySelector("canvas");

  let downloadUrl = "";
  if (qrImg && qrImg.src) {
    downloadUrl = qrImg.src;
  } else if (qrCanvas) {
    downloadUrl = qrCanvas.toDataURL("image/png");
  }

  if (downloadUrl) {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `svgp-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});

// 5. Reset / Generate Again
resetBtn.addEventListener("click", () => {
  fileInput.value = "";
  currentUploadedUrl = "";
  uploadStatus.innerText = "";
  qrStatusText.innerText = "Your QR code will appear here!";
  downloadBtn.setAttribute("disabled", "true");

  qrcodeBox.innerHTML = `
    <div class="qr-placeholder">
      <i class="fa-solid fa-qrcode"></i>
      <span>Upload an image to preview QR</span>
    </div>
  `;
});