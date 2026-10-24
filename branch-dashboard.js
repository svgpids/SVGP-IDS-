const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7PyrXNW7ViafJ2dOSH1idM_p1UZQQmKrdtpGvNIV5LZ6-7nZo9zAYOuD4jKu-X8kU7w/exec";

const urlParams = new URLSearchParams(window.location.search);
const branchQuery = urlParams.get("branch");
const storedBranch = localStorage.getItem("activeBranchCode");
const activeBranch = (branchQuery || storedBranch || "DECE").toUpperCase();

let allFetchedPhotos = [];
let currentSelectedYear = "all";
let currentSearchTerm = "";

const portalHeaderTitle = document.getElementById("portalHeaderTitle");
const activeBranchTag = document.getElementById("activeBranchTag");
const metaBranchCode = document.getElementById("metaBranchCode");
const metaFolderYear = document.getElementById("metaFolderYear");
const statsCounter = document.getElementById("statsCounter");
const photoCardsGrid = document.getElementById("photoCardsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const mobileTreeToggle = document.getElementById("mobileTreeToggle");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const sidebarTree = document.getElementById("sidebarTree");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const imageModal = document.getElementById("imageModal");
const closeImageModal = document.getElementById("closeImageModal");
const modalPreviewImg = document.getElementById("modalPreviewImg");
const modalPinTitle = document.getElementById("modalPinTitle");
const modalMetaSubtitle = document.getElementById("modalMetaSubtitle");
const btnCopyPin = document.getElementById("btnCopyPin");
const btnOpenDrive = document.getElementById("btnOpenDrive");
const toastNotice = document.getElementById("toastNotice");

portalHeaderTitle.textContent = `${activeBranch} DEPARTMENT PORTAL`;
activeBranchTag.textContent = activeBranch;
metaBranchCode.textContent = activeBranch;

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("activeBranchCode");
  localStorage.removeItem("activeBranchId");
  window.location.href = "branch-login.html";
});

function openDrawer() { sidebarTree.classList.add("open"); sidebarOverlay.classList.add("active"); }
function closeDrawer() { sidebarTree.classList.remove("open"); sidebarOverlay.classList.remove("active"); }

mobileTreeToggle.addEventListener("click", openDrawer);
closeSidebarBtn.addEventListener("click", closeDrawer);
sidebarOverlay.addEventListener("click", closeDrawer);

async function fetchBranchDriveData() {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  photoCardsGrid.innerHTML = "";
  statsCounter.textContent = "Connecting...";
  try {
    const reqUrl = `${APPS_SCRIPT_URL}?branch=${encodeURIComponent(activeBranch)}&year=all`;
    const res = await fetch(reqUrl);
    const data = await res.json();
    loadingState.style.display = "none";
    if (data.status === "error") { showEmpty(`Drive Error: ${data.message}`); return; }
    allFetchedPhotos = data.data || [];
    updateTreeCounts(allFetchedPhotos);
    filterAndRender();
  } catch (err) { loadingState.style.display = "none"; showEmpty(`Connection Failed: ${err.message}`); }
}

function updateTreeCounts(photos) {
  document.getElementById("badgeAll").textContent = photos.length;
  const count1st = photos.filter(p => p.year && p.year.toLowerCase().includes("1st")).length;
  const count2nd = photos.filter(p => p.year && p.year.toLowerCase().includes("2nd")).length;
  const count3rd = photos.filter(p => p.year && p.year.toLowerCase().includes("3rd")).length;
  document.getElementById("badge1st").textContent = count1st;
  document.getElementById("badge2nd").textContent = count2nd;
  document.getElementById("badge3rd").textContent = count3rd;
}

function filterAndRender() {
  let filtered = [...allFetchedPhotos];
  if (currentSelectedYear !== "all") {
    filtered = filtered.filter(p => p.year && p.year.toLowerCase().includes(currentSelectedYear.toLowerCase()));
  }
  if (currentSearchTerm) {
    filtered = filtered.filter(p => p.pin.toLowerCase().includes(currentSearchTerm) || p.fileName.toLowerCase().includes(currentSearchTerm));
  }
  statsCounter.textContent = `${filtered.length} Students`;
  if (filtered.length === 0) { showEmpty(`No records found for ${activeBranch}`); } 
  else { emptyState.style.display = "none"; renderCards(filtered); }
}

function renderCards(records) {
  photoCardsGrid.innerHTML = "";
  records.forEach(item => {
    const card = document.createElement("div");
    card.className = "student-card";
    const previewUrl = item.thumbnailUrl || `https://lh3.googleusercontent.com/d/${item.id}`;
    card.innerHTML = `<img class="student-thumb" src="${previewUrl}" alt="${item.pin}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=Error'"><div class="student-meta"><h4>${item.pin}</h4><p>${item.year} • ${item.branchFolder || activeBranch}</p></div>`;
    card.addEventListener("click", () => openPreviewModal(item, previewUrl));
    photoCardsGrid.appendChild(card);
  });
}

function showEmpty(msg) { emptyState.style.display = "block"; emptyMsg.textContent = msg; statsCounter.textContent = "0 Students"; photoCardsGrid.innerHTML = ""; }

function selectYear(yearValue) {
  currentSelectedYear = yearValue;
  metaFolderYear.textContent = yearValue === "all" ? "All Years" : yearValue;
  document.querySelectorAll(".tree-node").forEach(node => node.classList.toggle("active", node.getAttribute("data-year") === yearValue));
  document.querySelectorAll(".pill-btn").forEach(pill => pill.classList.toggle("active", pill.getAttribute("data-year") === yearValue));
  filterAndRender();
  closeDrawer();
}

document.querySelectorAll(".tree-node").forEach(node => node.addEventListener("click", () => selectYear(node.getAttribute("data-year"))));
document.querySelectorAll(".pill-btn").forEach(pill => pill.addEventListener("click", () => selectYear(pill.getAttribute("data-year"))));

searchInput.addEventListener("input", (e) => { currentSearchTerm = e.target.value.toLowerCase().trim(); clearSearchBtn.style.display = currentSearchTerm ? "block" : "none"; filterAndRender(); });
clearSearchBtn.addEventListener("click", () => { searchInput.value = ""; currentSearchTerm = ""; clearSearchBtn.style.display = "none"; filterAndRender(); });

let currentSelectedPin = "";
function openPreviewModal(item, imgUrl) {
  currentSelectedPin = item.pin;
  modalPinTitle.textContent = item.pin;
  modalMetaSubtitle.textContent = `${activeBranch} • ${item.year}`;
  modalPreviewImg.src = imgUrl;
  btnOpenDrive.href = `https://drive.google.com/file/d/${item.id}/view`;
  imageModal.classList.add("active");
}
closeImageModal.addEventListener("click", () => imageModal.classList.remove("active"));
imageModal.addEventListener("click", (e) => { if (e.target === imageModal) imageModal.classList.remove("active"); });

btnCopyPin.addEventListener("click", async () => {
  if (currentSelectedPin) { await navigator.clipboard.writeText(currentSelectedPin); showToast(`Copied ${currentSelectedPin}!`); }
});
function showToast(msg) { toastNotice.textContent = msg; toastNotice.classList.add("show"); setTimeout(() => toastNotice.classList.remove("show"), 2200); }

// ⏰ LIVE CLOCK
function updateLiveClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clockTime').textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

//  AUTO-LOGOUT TIMER
const LOGOUT_TIME = 10 * 60; 
let timeLeft = LOGOUT_TIME;
let logoutInterval;
const timerDisplay = document.getElementById('timerDisplay');
const logoutTimerBox = document.getElementById('logoutTimer');

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (timeLeft <= 60) { logoutTimerBox.classList.add('warning'); } 
  else { logoutTimerBox.classList.remove('warning'); }
}

function startLogoutTimer() {
  clearInterval(logoutInterval);
  logoutInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) { clearInterval(logoutInterval); performAutoLogout(); }
  }, 1000);
}

function resetLogoutTimer() {
  timeLeft = LOGOUT_TIME;
  updateTimerDisplay();
  startLogoutTimer();
}

function performAutoLogout() {
  localStorage.removeItem("activeBranchCode");
  localStorage.removeItem("activeBranchId");
  showToast("Session expired! Logging out...");
  setTimeout(() => { window.location.href = "branch-login.html"; }, 1500);
}

const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => { document.addEventListener(event, resetLogoutTimer, true); });

startLogoutTimer();
fetchBranchDriveData();