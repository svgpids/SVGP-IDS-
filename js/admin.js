// Session Authentication Check
if (sessionStorage.getItem("admin_logged") !== "true") {
  window.location.href = "admin-login.html";
}

// Logout Trigger
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem("admin_logged");
    window.location.href = "admin-login.html";
  });
}

// All ID Cards Link direct click handler (safeguard)
const allCardsLink = document.getElementById('allCardsLink');
if (allCardsLink) {
  allCardsLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = "test.html";
  });
}

// ImgBB API Key
const IMGBB_API_KEY = "40a302f53f0072826c2a779829f1d865";

// QR Generator Elements
const idInput = document.getElementById('idCardInput');
const statusMsg = document.getElementById('statusMsg');
const loader = document.getElementById('loader');
const qrBox = document.getElementById('qrResultArea');
const qrcodeElement = document.getElementById('qrcode');
const linkInput = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');
const previewPassBtn = document.getElementById('previewPassBtn');

// LocalStorage Persistent Card Storage
function getSavedCards() {
  return JSON.parse(localStorage.getItem('svgp_cards') || '[]');
}

function saveCard(cardObj) {
  const cards = getSavedCards();
  cards.unshift(cardObj);
  localStorage.setItem('svgp_cards', JSON.stringify(cards));
}

// Image File Upload & Instant QR Processing
if (idInput) {
  idInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusMsg.textContent = "Compressing ID Card with high fidelity...";
    loader.style.display = "block";

    try {
      const compressedBlob = await compressImage(file);
      statusMsg.textContent = "Storing in secure institutional cloud...";
      const imageUrl = await uploadToImgBB(compressedBlob);

      // Create encrypted pass token (Base64 parameter for direct rendering)
      const token = encodeURIComponent(btoa(imageUrl));
      const baseUrl = window.location.origin + window.location.pathname.replace("admin-dashboard.html", "index.html");
      const fullCardUrl = `${baseUrl}?card=${token}`;

      // Render Clean High-Contrast QR Code
      qrcodeElement.innerHTML = "";
      new QRCode(qrcodeElement, {
        text: fullCardUrl,
        width: 180,
        height: 180,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });

      linkInput.value = fullCardUrl;
      previewPassBtn.href = fullCardUrl;
      loader.style.display = "none";
      statusMsg.textContent = "✨ Digital Card issued & QR Code ready!";
      qrBox.style.display = "block";

      // Save record to LocalStorage so test.html can display it
      const now = new Date();
      saveCard({
        id: Date.now(),
        image: imageUrl,
        link: fullCardUrl,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

    } catch (err) {
      loader.style.display = "none";
      statusMsg.textContent = "Upload failed: " + err.message;
    }
  });
}

// Copy Pass Link
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    linkInput.select();
    document.execCommand('copy');
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy Link", 2000);
  });
}

// Canvas-based Client-side Image Compression
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let maxDim = 950;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
      };
    };
  });
}

// ImgBB REST API Sync
async function uploadToImgBB(blob) {
  const formData = new FormData();
  formData.append('image', blob);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data && data.success && data.data && data.data.url) {
    return data.data.url;
  } else {
    throw new Error(data.error ? data.error.message : "Cloud upload failed");
  }
}