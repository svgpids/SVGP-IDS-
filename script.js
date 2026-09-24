// Mee Genuine Working ImgBB API Key
const IMGBB_API_KEY = "40a302f53f0072826c2a779829f1d865";

// Default Admin Security PIN
const DEFAULT_ADMIN_PIN = "1234";

// UI Elements
const adminToggleBtn = document.getElementById('adminToggleBtn');
const adminPanel = document.getElementById('adminPanel');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const adminAuthLock = document.getElementById('adminAuthLock');
const adminDashboard = document.getElementById('adminDashboard');
const adminPinInput = document.getElementById('adminPinInput');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const authError = document.getElementById('authError');

const idUpload = document.getElementById('idUpload');
const msg = document.getElementById('msg');
const loader = document.getElementById('loader');
const qrArea = document.getElementById('qrArea');
const qrcodeDiv = document.getElementById('qrcode');
const shareUrlInput = document.getElementById('shareUrl');
const copyLinkBtn = document.getElementById('copyLinkBtn');

const cardScene = document.getElementById('cardScene');
const card3D = document.getElementById('card3D');
const cardFullImage = document.getElementById('cardFullImage');

// 1. Google Lens / QR scan tho phone lo open ayinappudu
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('card')) {
    const cardData = urlParams.get('card');
    try {
      const decodedImgUrl = atob(decodeURIComponent(cardData));
      cardFullImage.src = decodedImgUrl;
      // Phone lo scan chesinappudu admin box kanapadadu, only 3D ID Card vastundi
      if (adminPanel) adminPanel.classList.add('hidden');
    } catch (e) {
      console.error("Invalid card token", e);
    }
  }
});

// 2. Admin Panel Toggle & Authentication
adminToggleBtn.addEventListener('click', () => {
  adminPanel.classList.toggle('hidden');
});

closeAdminBtn.addEventListener('click', () => {
  adminPanel.classList.add('hidden');
});

adminLoginBtn.addEventListener('click', () => {
  if (adminPinInput.value === DEFAULT_ADMIN_PIN) {
    adminAuthLock.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    authError.classList.add('hidden');
  } else {
    authError.classList.remove('hidden');
  }
});

// 3. 3D Tilt Dynamics (Mouse & Mobile Touch)
const handleTilt = (clientX, clientY, rect) => {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const rx = ((clientY - rect.top - cy) / cy) * -18;
  const ry = ((clientX - rect.left - cx) / cx) * 18;
  card3D.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
};

cardScene.addEventListener('mousemove', (e) => {
  const rect = card3D.getBoundingClientRect();
  handleTilt(e.clientX, e.clientY, rect);
});

cardScene.addEventListener('mouseleave', () => {
  card3D.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

cardScene.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    const rect = card3D.getBoundingClientRect();
    handleTilt(e.touches[0].clientX, e.touches[0].clientY, rect);
  }
}, { passive: true });

cardScene.addEventListener('touchend', () => {
  card3D.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

// 4. Admin Card Upload & Cloud Issuing
idUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  msg.textContent = "Processing and optimizing card image...";
  loader.classList.remove('hidden');

  try {
    // 1. Image compression (Proportions retain chestundi)
    const fullBlob = await compressCardImage(file);

    // 2. ImgBB Cloud Upload
    msg.textContent = "Uploading to secure cloud...";
    const cloudImageUrl = await uploadToImgBB(fullBlob);

    // 3. Instant 3D Stage Preview
    cardFullImage.src = cloudImageUrl;

    // 4. Unique Card Token Link Create
    const cardToken = encodeURIComponent(btoa(cloudImageUrl));
    const domain = window.location.origin + window.location.pathname;
    const uniqueCardLink = `${domain}?card=${cardToken}`;

    // 5. Generate Clear QR Code
    qrcodeDiv.innerHTML = "";
    new QRCode(qrcodeDiv, {
      text: uniqueCardLink,
      width: 175,
      height: 175,
      colorDark: "#0b1f3a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });

    shareUrlInput.value = uniqueCardLink;
    loader.classList.add('hidden');
    msg.textContent = "ID Card Issued Successfully!";
    qrArea.classList.remove('hidden');

  } catch (err) {
    loader.classList.add('hidden');
    msg.textContent = "Upload failed: " + err.message;
    console.error(err);
  }
});

// Copy link button
copyLinkBtn.addEventListener('click', () => {
  shareUrlInput.select();
  document.execCommand('copy');
  copyLinkBtn.textContent = "Copied!";
  setTimeout(() => copyLinkBtn.textContent = "Copy Link", 2000);
});

// Image compression helper
function compressCardImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let maxDimension = 950;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDimension) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else if (h > maxDimension) {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
      };
    };
  });
}

// ImgBB Direct API Upload (No Unknown Key / No CORS error)
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