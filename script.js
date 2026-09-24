// Mee ImgBB API Key
const IMGBB_API_KEY = "40a302f53f0072826c2a779829f1d865";

const idUpload = document.getElementById('idUpload');
const msg = document.getElementById('msg');
const loader = document.getElementById('loader');
const qrArea = document.getElementById('qrArea');
const qrcodeDiv = document.getElementById('qrcode');
const adminBox = document.getElementById('adminBox');

const cardScene = document.getElementById('cardScene');
const card3D = document.getElementById('card3D');
const cardFullImage = document.getElementById('cardFullImage');

// 1. Google Lens / Camera scan tho open ayinappudu
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('img')) {
    const imgUrl = urlParams.get('img');
    cardFullImage.src = imgUrl;
    if (adminBox) adminBox.classList.add('hidden'); // Mobile scan lo complete 3D card display avtundi
  }
});

// 2. 3D Tilt Effect (Mouse & Touch gestures)
const tilt = (x, y, rect) => {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const rx = ((y - cy) / cy) * -16;
  const ry = ((x - cx) / cx) * 16;
  card3D.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
};

cardScene.addEventListener('mousemove', (e) => {
  const rect = card3D.getBoundingClientRect();
  tilt(e.clientX - rect.left, e.clientY - rect.top, rect);
});

cardScene.addEventListener('mouseleave', () => {
  card3D.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

cardScene.addEventListener('touchmove', (e) => {
  const rect = card3D.getBoundingClientRect();
  const touch = e.touches[0];
  tilt(touch.clientX - rect.left, touch.clientY - rect.top, rect);
});

// 3. ID Card Upload -> Full Image Cloud Upload -> QR Generation
idUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  msg.textContent = "Processing full ID card image...";
  loader.classList.remove('hidden');

  try {
    // A. Image compression (Crop lekunda full original card image)
    const fullImageBlob = await compressFullImage(file);

    // B. ImgBB cloud ki upload
    msg.textContent = "Uploading to cloud...";
    const cloudImageUrl = await uploadToImgBB(fullImageBlob);

    // C. Screen meedha instant ga preview set cheyadam
    cardFullImage.src = cloudImageUrl;

    // D. Short Universal URL Build
    const baseUrl = window.location.origin + window.location.pathname;
    const finalScanUrl = `${baseUrl}?img=${encodeURIComponent(cloudImageUrl)}`;

    // E. Clear QR Code Render
    qrcodeDiv.innerHTML = "";
    new QRCode(qrcodeDiv, {
      text: finalScanUrl,
      width: 170,
      height: 170,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });

    loader.classList.add('hidden');
    msg.textContent = "QR Ready! Scan from Google Lens or any phone.";
    qrArea.classList.remove('hidden');

  } catch (err) {
    loader.classList.add('hidden');
    msg.textContent = "Error processing image. Please try again.";
    console.error(err);
  }
});

// Full image compression helper
function compressFullImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let maxDim = 900;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDim) {
          h = (h * maxDim) / w;
          w = maxDim;
        } else if (h > maxDim) {
          w = (w * maxDim) / h;
          h = maxDim;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      };
    };
  });
}

// ImgBB API Upload helper
async function uploadToImgBB(blob) {
  const formData = new FormData();
  formData.append('image', blob);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  if (data && data.data && data.data.url) {
    return data.data.url;
  } else {
    throw new Error("ImgBB upload failed");
  }
}