// Eegumsa seensaa mirkaneessuu
if (sessionStorage.getItem("admin_auth") !== "true") {
  window.location.href = "admin-login.html";
}

// Bahiinsa (Logout)
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.removeItem("admin_auth");
  window.location.href = "admin-login.html";
});

// ImgBB API Key
const IMGBB_API_KEY = "40a302f53f0072826c2a779829f1d865";

// Daataa Dameelee Dhaabbataa (Official SBTET Branches)
let branchData = [
  { code: "DCE", name: "Civil Engineering", intake: 60, hod: "Sri. K. Ramesh" },
  { code: "DEEE", name: "Electrical & Electronics Engg.", intake: 120, hod: "Dr. P. Suresh" },
  { code: "DME", name: "Mechanical Engineering", intake: 120, hod: "Sri. M. Venkat" },
  { code: "DECE", name: "Electronics & Communication Engg.", intake: 120, hod: "Dr. K. Praveen" },
  { code: "DCME", name: "Computer Engineering", intake: 60, hod: "Smt. G. Swetha" },
  { code: "DCHE", name: "Chemical Engineering", intake: 60, hod: "Sri. B. Narayana" },
  { code: "DIT", name: "Information Technology", intake: 60, hod: "Sri. V. Prasad" },
  { code: "DPT", name: "Plastics Technology", intake: 30, hod: "Dr. C. Mohan" },
  { code: "DPRI", name: "Printing Technology", intake: 30, hod: "Sri. R. Krishna" }
];

// Qabduuwwan (Tab Switching)
const tabBtns = document.querySelectorAll('.nav-tab-btn');
const tabPanes = document.querySelectorAll('.dash-pane');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const target = btn.getAttribute('data-tab');
    document.getElementById(target).classList.add('active');
  });
});

// Gabatee Dameelee Agarsiisuu
function renderBranches() {
  const tbody = document.getElementById('branchesTableBody');
  tbody.innerHTML = "";
  branchData.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${b.code}</strong></td>
      <td>${b.name}</td>
      <td>${b.intake}</td>
      <td>${b.hod}</td>
    `;
    tbody.appendChild(tr);
  });
}
renderBranches();

// Damee Haaraa Dabaluu
document.getElementById('btnAddBranch').addEventListener('click', () => {
  const name = document.getElementById('newBranchName').value.trim();
  const code = document.getElementById('newBranchCode').value.trim().toUpperCase();
  const intake = document.getElementById('newBranchIntake').value.trim();

  if (!name || !code) {
    alert("Maaloo maqaa fi koodii damee galchaa!");
    return;
  }

  branchData.push({
    code: code,
    name: name,
    intake: intake || 60,
    hod: "Appointed HOD"
  });

  renderBranches();
  document.getElementById('newBranchName').value = "";
  document.getElementById('newBranchCode').value = "";
  document.getElementById('newBranchIntake').value = "";
  alert(`Dameen ${code} milkaa'inaan dabalameera!`);
});

// QR Koodii Uumuu fi ImgBB Olkaa'uu
const idUpload = document.getElementById('idUpload');
const msg = document.getElementById('msg');
const loader = document.getElementById('loader');
const qrArea = document.getElementById('qrArea');
const qrcodeDiv = document.getElementById('qrcode');
const shareUrlInput = document.getElementById('shareUrl');
const copyLinkBtn = document.getElementById('copyLinkBtn');

idUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  msg.textContent = "Suuraan waraqaa eenyummaa qophaa'aa jira...";
  loader.style.display = "block";

  try {
    const compressedBlob = await compressImage(file);
    msg.textContent = "Sarvarii irratti olkaa'amaa jira...";
    const cloudImageUrl = await uploadToImgBB(compressedBlob);

    // Koodii icciitiin dachaasuu (Base64 URL Token)
    const cardToken = encodeURIComponent(btoa(cloudImageUrl));
    const domain = window.location.origin + window.location.pathname.replace("admin-dashboard.html", "index.html");
    const uniqueCardLink = `${domain}?card=${cardToken}`;

    // QR Koodii Uumuu
    qrcodeDiv.innerHTML = "";
    new QRCode(qrcodeDiv, {
      text: uniqueCardLink,
      width: 180,
      height: 180,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });

    shareUrlInput.value = uniqueCardLink;
    loader.style.display = "none";
    msg.textContent = "✨ QR Koodiin waraqaa eenyummaa milkaa'inaan uumameera!";
    qrArea.style.display = "block";

    // Galmee seenaa waraqaalee baafamaniitti dabaluu
    appendIssuedHistory(cloudImageUrl, uniqueCardLink);

  } catch (err) {
    loader.style.display = "none";
    msg.textContent = "Hojiin hin milkoofne: " + err.message;
  }
});

function appendIssuedHistory(imgUrl, link) {
  const tbody = document.getElementById('issuedHistoryBody');
  if (tbody.innerHTML.includes("Hanga ammaatti")) {
    tbody.innerHTML = "";
  }
  const now = new Date();
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${now.toLocaleDateString()} <br><small>${now.toLocaleTimeString()}</small></td>
    <td><img src="${imgUrl}" style="width:36px; height:46px; object-fit:cover; border-radius:4px; border:1px solid #cbd5e1;"></td>
    <td><a href="${link}" target="_blank" style="color:#7c3aed; font-weight:700; text-decoration:none;">Bani ↗</a></td>
  `;
  tbody.prepend(tr);
}

// Geessituu Waraabuu (Copy Link)
copyLinkBtn.addEventListener('click', () => {
  shareUrlInput.select();
  document.execCommand('copy');
  copyLinkBtn.textContent = "Waraabameera!";
  setTimeout(() => copyLinkBtn.textContent = "Waraabi (Copy)", 2000);
});

// Suuraa xiqqeessuu (Canvas Compression)
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

// ImgBB API
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
    throw new Error(data.error ? data.error.message : "Sarvarii irratti fe'uu hin dandeenye");
  }
}