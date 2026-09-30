// SVGP Google Apps Script API Deployment URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7PyrXNW7ViafJ2dOSH1idM_p1UZQQmKrdtpGvNIV5LZ6-7nZo9zAYOuD4jKu-X8kU7w/exec";

// 1. Session & Branch Context Detection
const urlParams = new URLSearchParams(window.location.search);
const branchQuery = urlParams.get("branch");
const storedBranch = localStorage.getItem("activeBranchCode");

// Active logged-in branch (e.g., DECE, DCE, DCME)
const activeBranch = (branchQuery || storedBranch || "DECE").toUpperCase();

// Local Cache
let allFetchedPhotos = [];
let currentSelectedYear = "all";
let currentSearchTerm = "";

// DOM Elements
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

// Mobile Drawer Elements
const mobileTreeToggle = document.getElementById("mobileTreeToggle");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const sidebarTree = document.getElementById("sidebarTree");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Modal Elements
const imageModal = document.getElementById("imageModal");
const closeImageModal = document.getElementById("closeImageModal");
const modalPreviewImg = document.getElementById("modalPreviewImg");
const modalPinTitle = document.getElementById("modalPinTitle");
const modalMetaSubtitle = document.getElementById("modalMetaSubtitle");
const btnCopyPin = document.getElementById("btnCopyPin");
const btnOpenDrive = document.getElementById("btnOpenDrive");
const toastNotice = document.getElementById("toastNotice");

// Initialize UI
portalHeaderTitle.textContent = `${activeBranch} DEPARTMENT PORTAL`;
activeBranchTag.textContent = activeBranch;
metaBranchCode.textContent = activeBranch;

// Logout Handler
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("activeBranchCode");
  localStorage.removeItem("activeBranchId");
  window.location.href = "branch-login.html";
});

// Mobile Drawer Controls
function openDrawer() {
  sidebarTree.classList.add("open");
  sidebarOverlay.classList.add("active");
}
function closeDrawer() {
  sidebarTree.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}
mobileTreeToggle.addEventListener("click", openDrawer);
closeSidebarBtn.addEventListener("click", closeDrawer);
sidebarOverlay.addEventListener("click", closeDrawer);

// 2. Fetch Photos from Drive for Active Branch
async function fetchBranchDriveData() {
  loadingState.style.display = "block";
  emptyState.style.display = "none";
  photoCardsGrid.innerHTML = "";
  statsCounter.textContent = "Connecting...";

  try {
    // Fetch all academic years for this specific branch
    const reqUrl = `${APPS_SCRIPT_URL}?branch=${encodeURIComponent(activeBranch)}&year=all`;
    const res = await fetch(reqUrl);
    const data = await res.json();

    loadingState.style.display = "none";

    if (data.status === "error") {
      showEmpty(`Drive Error: ${data.message}`);
      return;
    }

    allFetchedPhotos = data.data || [];

    // Calculate Counts for Folder Tree Badges
    updateTreeCounts(allFetchedPhotos);

    // Initial render
    filterAndRender();

  } catch (err) {
    loadingState.style.display = "none";
    showEmpty(`Connection Failed: ${err.message}`);
  }
}

// 3. Update Folder Badges in Tree
function updateTreeCounts(photos) {
  document.getElementById("badgeAll").textContent = photos.length;

  const count1st = photos.filter(p => p.year && p.year.toLowerCase().includes("1st")).length;
  const count2nd = photos.filter(p => p.year && p.year.toLowerCase().includes("2nd")).length;
  const count3rd = photos.filter(p => p.year && p.year.toLowerCase().includes("3rd")).length;

  document.getElementById("badge1st").textContent = count1st;
  document.getElementById("badge2nd").textContent = count2nd;
  document.getElementById("badge3rd").textContent = count3rd;
}

// 4. Filtering Logic (Year + Search Term)
function filterAndRender() {
  let filtered = [...allFetchedPhotos];

  // Year Filter
  if (currentSelectedYear !== "all") {
    filtered = filtered.filter(p => 
      p.year && p.year.toLowerCase().includes(currentSelectedYear.toLowerCase())
    );
  }

  // Search Filter (PIN or File Name)
  if (currentSearchTerm) {
    filtered = filtered.filter(p => 
      p.pin.toLowerCase().includes(currentSearchTerm) ||
      p.fileName.toLowerCase().includes(currentSearchTerm)
    );
  }

  // Update Stats
  statsCounter.textContent = `${filtered.length} Students`;

  // Render
  if (filtered.length === 0) {
    showEmpty(`No records found for ${activeBranch} (${currentSelectedYear.toUpperCase()})`);
  } else {
    emptyState.style.display = "none";
    renderCards(filtered);
  }
}

// 5. Render Grid Cards
function renderCards(records) {
  photoCardsGrid.innerHTML = "";

  records.forEach(item => {
    const card = document.createElement("div");
    card.className = "student-card";

    // Direct Google Drive image preview
    const previewUrl = item.thumbnailUrl || `https://lh3.googleusercontent.com/d/${item.id}`;

    card.innerHTML = `
      <img class="student-thumb" src="${previewUrl}" alt="${item.pin}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=Load+Error'">
      <div class="student-meta">
        <h4>${item.pin}</h4>
        <p>${item.year} &bull; ${item.branchFolder || activeBranch}</p>
      </div>
    `;

    // Click to Open Full Preview Modal
    card.addEventListener("click", () => openPreviewModal(item, previewUrl));

    photoCardsGrid.appendChild(card);
  });
}

function showEmpty(msg) {
  emptyState.style.display = "block";
  emptyMsg.textContent = msg;
  statsCounter.textContent = "0 Students";
  photoCardsGrid.innerHTML = "";
}

// 6. Year Selection Synchronization (Both Tree Nodes and Pills)
function selectYear(yearValue) {
  currentSelectedYear = yearValue;
  metaFolderYear.textContent = yearValue === "all" ? "All Years" : yearValue;

  // Sync Folder Tree selection
  document.querySelectorAll(".tree-node").forEach(node => {
    node.classList.toggle("active", node.getAttribute("data-year") === yearValue);
  });

  // Sync Top Pills selection
  document.querySelectorAll(".pill-btn").forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-year") === yearValue);
  });

  filterAndRender();
  closeDrawer(); // Close drawer on mobile after selection
}

// Sidebar Tree Nodes Event
document.querySelectorAll(".tree-node").forEach(node => {
  node.addEventListener("click", () => {
    selectYear(node.getAttribute("data-year"));
  });
});

// Top Pills Event
document.querySelectorAll(".pill-btn").forEach(pill => {
  pill.addEventListener("click", () => {
    selectYear(pill.getAttribute("data-year"));
  });
});

// 7. Search Input Listeners
searchInput.addEventListener("input", (e) => {
  currentSearchTerm = e.target.value.toLowerCase().trim();
  clearSearchBtn.style.display = currentSearchTerm ? "block" : "none";
  filterAndRender();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentSearchTerm = "";
  clearSearchBtn.style.display = "none";
  filterAndRender();
});

// 8. Image Preview Modal Controls
let currentSelectedPin = "";

function openPreviewModal(item, imgUrl) {
  currentSelectedPin = item.pin;
  modalPinTitle.textContent = item.pin;
  modalMetaSubtitle.textContent = `${activeBranch} • ${item.year} • Folder: ${item.branchFolder || activeBranch}`;
  modalPreviewImg.src = imgUrl;

  // Google Drive link
  btnOpenDrive.href = `https://drive.google.com/file/d/${item.id}/view`;

  imageModal.classList.add("active");
}

closeImageModal.addEventListener("click", () => imageModal.classList.remove("active"));
imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) imageModal.classList.remove("active");
});

// Copy PIN to Clipboard
btnCopyPin.addEventListener("click", async () => {
  if (currentSelectedPin) {
    await navigator.clipboard.writeText(currentSelectedPin);
    showToast(`Copied ${currentSelectedPin} to clipboard!`);
  }
});

function showToast(msg) {
  toastNotice.textContent = msg;
  toastNotice.classList.add("show");
  setTimeout(() => toastNotice.classList.remove("show"), 2200);
}

// First Load Execution
fetchBranchDriveData();