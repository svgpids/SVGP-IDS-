// PRECONFIGURED PRODUCTION CONFIG
const API_URL = "https://script.google.com/macros/s/AKfycbwEFwbaOOLAE82d9JZXS7V1Mwt3EUj99ha36iDR4xFF6CNFhDNFQm0qtANI58zPnxLk5w/exec";
const API_TOKEN = "svgp_admin_secret_token_2026";
const ROOT_FOLDER_ID = "1v-unZCG5jCt6fAyq-ZAvSxl0xEeEMj6J";

// COLOR DICTIONARY PER BRANCH
const BRANCH_THEMES = {
  "ECE": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-600 text-white", hex: "#4338ca" },
  "ECII": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-600 text-white", hex: "#2563eb" },
  "CME": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-600 text-white", hex: "#7c3aed" },
  "EEE A": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", badge: "bg-amber-600 text-white", hex: "#d97706" },
  "EEE B": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", badge: "bg-yellow-600 text-white", hex: "#ca8a04" },
  "CIVIL A": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", badge: "bg-emerald-600 text-white", hex: "#059669" },
  "CIVIL B": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", badge: "bg-green-600 text-white", hex: "#16a34a" },
  "MECH A": { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", badge: "bg-rose-600 text-white", hex: "#e11d48" },
  "MECH B": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", badge: "bg-red-600 text-white", hex: "#dc2626" },
  "BME": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", badge: "bg-teal-600 text-white", hex: "#0d9488" },
  "CHST": { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200", badge: "bg-cyan-600 text-white", hex: "#0891b2" }
};

function getBranchTheme(branchName) {
  const clean = (branchName || "").toUpperCase().trim();
  for (const key in BRANCH_THEMES) {
    if (clean.includes(key)) return BRANCH_THEMES[key];
  }
  return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-700 text-white", hex: "#475569" };
}

let currentFolderId = ROOT_FOLDER_ID;
let currentFolderName = "SVGP_IDS";
let activeFiles = [];
let treeData = null;
let currentZoom = 1;
let searchDebounceTimer = null;

// CENTRAL API CALL
async function apiCall(action, params = {}, method = "GET") {
  try {
    if (method === "GET") {
      const q = new URLSearchParams({ action, token: API_TOKEN, ...params });
      const res = await fetch(`${API_URL}?${q.toString()}`);
      return await res.json();
    } else {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, token: API_TOKEN, ...params })
      });
      return await res.json();
    }
  } catch (err) {
    console.error("API Call Error:", err);
    return { success: false, message: err.toString() };
  }
}

// ON DOM LOAD
window.addEventListener("DOMContentLoaded", () => {
  loadTree();
  setupEventListeners();
});

// LOAD TREE
async function loadTree() {
  const treeContainer = document.getElementById("treeContainer");
  treeContainer.innerHTML = '<div class="py-8 text-center text-xs text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-blue-700"></i>Syncing Folders...</div>';

  const res = await apiCall("getTree", { folderId: ROOT_FOLDER_ID });
  if (res && res.success && res.data) {
    treeData = res.data;
    renderTree(treeData);
    
    // Automatically select the first batch's first branch
    if (treeData.children && treeData.children.length > 0) {
      const firstBatch = treeData.children[0];
      if (firstBatch.children && firstBatch.children.length > 0) {
        selectFolder(firstBatch.children[0].id, firstBatch.children[0].name, `${firstBatch.name} / ${firstBatch.children[0].name}`);
      } else {
        selectFolder(firstBatch.id, firstBatch.name, firstBatch.name);
      }
    } else {
      selectFolder(treeData.id, treeData.name, treeData.name);
    }
  } else {
    treeContainer.innerHTML = `<div class="p-3 text-rose-500 text-xs">Error: ${res.message || "Failed to load"}</div>`;
  }
}

// RENDER TREE
function renderTree(root) {
  const container = document.getElementById("treeContainer");
  let folderCount = 0;

  function buildTreeHTML(node) {
    if (!node) return "";
    folderCount++;
    const hasChildren = node.children && node.children.length > 0;
    const theme = getBranchTheme(node.name);
    
    let html = `<div class="select-none">`;
    html += `
      <div class="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-700 transition group" onclick="selectFolder('${node.id}', '${node.name}')">
        <div class="flex items-center space-x-2 truncate">
          ${hasChildren 
            ? `<i class="fa-solid fa-folder-closed text-amber-500 text-xs"></i>` 
            : `<span class="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style="background-color: ${theme.hex};"></span>`
          }
          <span class="truncate font-semibold text-xs ${hasChildren ? 'text-slate-800 font-bold' : theme.text}">${node.name}</span>
        </div>
        ${hasChildren ? `<span class="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-bold">${node.children.length}</span>` : ''}
      </div>
    `;

    if (hasChildren) {
      html += `<div class="border-l border-slate-200 ml-3.5 pl-1.5 space-y-0.5 mt-0.5">`;
      node.children.forEach(child => {
        html += buildTreeHTML(child);
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  container.innerHTML = buildTreeHTML(root);
  document.getElementById("folderCountBadge").innerText = `${folderCount} Folders`;
}

// SELECT FOLDER & LOAD CARDS
async function selectFolder(folderId, branchName, fullPath = null) {
  currentFolderId = folderId;
  currentFolderName = branchName;
  const pathDisplay = fullPath || branchName;
  
  document.getElementById("currentPath").innerText = pathDisplay;
  document.getElementById("targetFolderDisplay").value = pathDisplay;

  const theme = getBranchTheme(branchName);
  const icon = document.getElementById("branchPillIcon");
  icon.style.backgroundColor = theme.hex;
  document.getElementById("branchTagSubtitle").innerText = `Department of ${branchName} • Live Drive Storage`;

  closeDrawer();

  const grid = document.getElementById("fileGrid");
  const emptyState = document.getElementById("emptyState");
  const loading = document.getElementById("gridLoading");

  grid.innerHTML = "";
  emptyState.classList.add("hidden");
  loading.classList.remove("hidden");

  const res = await apiCall("getContents", { folderId });
  loading.classList.add("hidden");

  if (res && res.success && res.data) {
    activeFiles = res.data.files || [];
    document.getElementById("fileCountBadge").innerText = `${activeFiles.length} Cards`;
    renderFileGrid(activeFiles, theme);
  } else {
    emptyState.classList.remove("hidden");
  }
}

// RENDER COLOR-THEMED CARDS
function renderFileGrid(files, branchTheme = null) {
  const grid = document.getElementById("fileGrid");
  const emptyState = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (!files || files.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  files.forEach(file => {
    const parsed = parseStudentId(file.name);
    const theme = branchTheme || getBranchTheme(parsed.branch);
    const card = document.createElement("div");
    card.className = `student-card bg-white border ${theme.border} rounded-2xl p-2.5 flex flex-col relative group overflow-hidden shadow-xs`;

    // Multi-source safe URLs
    const primaryImg = `https://lh3.googleusercontent.com/d/${file.id}=s500`;
    const fallbackImg = `https://drive.google.com/thumbnail?id=${file.id}&sz=w500`;
    const fileDataStr = encodeURIComponent(JSON.stringify(file));

    card.innerHTML = `
      <div class="w-full h-40 sm:h-44 ${theme.bg} rounded-xl overflow-hidden flex items-center justify-center mb-2.5 cursor-pointer relative border border-slate-100" onclick="handleCardClick('${fileDataStr}')">
        <img src="${primaryImg}" 
             referrerpolicy="no-referrer"
             loading="lazy" 
             alt="${file.name}" 
             class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
             onerror="this.src='${fallbackImg}'">
        
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md ${theme.badge} text-[9px] font-black shadow-xs">
          ${parsed.branch}
        </span>
      </div>

      <div class="w-full px-0.5" onclick="handleCardClick('${fileDataStr}')">
        <div class="flex items-center justify-between">
          <span class="block text-xs font-black text-slate-900 truncate tracking-tight">${parsed.rollNumber}</span>
          <i class="fa-solid fa-expand text-[10px] text-slate-400 group-hover:text-blue-700 transition"></i>
        </div>
        <span class="block text-[10px] text-slate-400 font-mono truncate mt-0.5">${file.name}</span>
      </div>

      <button class="absolute top-3.5 right-3.5 bg-white text-rose-500 border border-rose-200 p-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition hover:bg-rose-50 shadow-sm" 
              title="Move to Trash" 
              onclick="event.stopPropagation(); deleteFile('${file.id}', '${file.name}')">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    grid.appendChild(card);
  });
}

function handleCardClick(fileDataStr) {
  const file = JSON.parse(decodeURIComponent(fileDataStr));
  openPreview(file);
}

// ENHANCED GLOBAL & LOCAL SEARCH ENGINE
function filterCards(query) {
  const q = query.toLowerCase().trim();
  const clearBtn = document.getElementById("clearSearchBtn");

  if (q) clearBtn.classList.remove("hidden");
  else clearBtn.classList.add("hidden");

  if (!q) {
    renderFileGrid(activeFiles);
    document.getElementById("fileCountBadge").innerText = `${activeFiles.length} Cards`;
    return;
  }

  // 1. Current Branch instant search
  const cleanQ = q.replace(/[^a-z0-9]/gi, "");
  const localFiltered = activeFiles.filter(f => {
    const parsed = parseStudentId(f.name);
    const cleanFileName = f.name.toLowerCase().replace(/[^a-z0-9]/gi, "");
    const cleanRoll = parsed.rollNumber.toLowerCase().replace(/[^a-z0-9]/gi, "");
    const cleanBranch = parsed.branch.toLowerCase().replace(/[^a-z0-9]/gi, "");

    return cleanFileName.includes(cleanQ) || 
           cleanRoll.includes(cleanQ) || 
           cleanBranch.includes(cleanQ);
  });

  if (localFiltered.length > 0) {
    renderFileGrid(localFiltered);
    document.getElementById("fileCountBadge").innerText = `${localFiltered.length} Found (This Branch)`;
    return;
  }

  // 2. Drive Global Deep Search
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    await performGlobalDriveSearch(q);
  }, 400);
}

// GLOBAL GOOGLE DRIVE SEARCH
async function performGlobalDriveSearch(query) {
  const grid = document.getElementById("fileGrid");
  const emptyState = document.getElementById("emptyState");
  const loading = document.getElementById("gridLoading");

  grid.innerHTML = "";
  emptyState.classList.add("hidden");
  loading.classList.remove("hidden");
  document.getElementById("branchTagSubtitle").innerText = `Global Search in Drive for "${query}"...`;

  try {
    const res = await apiCall("search", { query: query }, "GET");
    loading.classList.add("hidden");

    if (res && res.success && res.data && res.data.length > 0) {
      document.getElementById("fileCountBadge").innerText = `${res.data.length} Found (All Batches)`;
      renderFileGrid(res.data);
    } else {
      emptyState.classList.remove("hidden");
      emptyState.innerHTML = `
        <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl shadow-xs mb-3">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <p class="text-xs font-bold text-slate-700">No Student Found matching "${query}"</p>
        <p class="text-[11px] text-slate-400 mt-1">Roll number or file name cross-check cheskondi.</p>
      `;
    }
  } catch (err) {
    loading.classList.add("hidden");
    emptyState.classList.remove("hidden");
    console.error("Global search error:", err);
  }
}

// STUDENT ID PARSER
function parseStudentId(filename) {
  const clean = filename.replace(/\.[^/.]+$/, "");
  const match = clean.match(/(\d{2})\d{3}-([A-Za-z]+)-(\d+)/);
  if (match) {
    return {
      rollNumber: `${match[1]}018-${match[2].toUpperCase()}-${match[3]}`,
      branch: match[2].toUpperCase()
    };
  }
  return { rollNumber: clean, branch: currentFolderName || "GENERAL" };
}

// FULL PREVIEW MODAL & CONTROLS
function openPreview(file) {
  const parsed = parseStudentId(file.name);
  const theme = getBranchTheme(parsed.branch);
  currentZoom = 1;

  document.getElementById("previewRoll").innerText = parsed.rollNumber;
  document.getElementById("previewFileName").innerText = file.name;

  const branchBadge = document.getElementById("previewBranch");
  branchBadge.innerText = parsed.branch;
  branchBadge.className = `px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${theme.bg} ${theme.text} ${theme.border}`;

  const imgBox = document.getElementById("previewImgBox");
  imgBox.style.borderColor = theme.hex;

  const img = document.getElementById("previewImg");
  img.style.transform = `scale(1)`;
  img.src = `https://lh3.googleusercontent.com/d/${file.id}=s1200`;
  img.onerror = () => { img.src = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`; };

  document.getElementById("previewDriveLink").href = file.viewUrl || `https://drive.google.com/file/d/${file.id}/view`;

  document.getElementById("previewDeleteBtn").onclick = () => {
    closePreviewModal();
    deleteFile(file.id, file.name);
  };

  document.getElementById("copyRollBtn").onclick = () => {
    navigator.clipboard.writeText(parsed.rollNumber);
    showToast(`Copied ${parsed.rollNumber} to clipboard!`);
  };

  document.getElementById("printBadgeBtn").onclick = () => {
    window.print();
  };

  document.getElementById("previewModal").classList.remove("hidden");
}

function closePreviewModal() {
  document.getElementById("previewModal").classList.add("hidden");
}

// ZOOM CONTROLS
document.getElementById("zoomInBtn").onclick = () => {
  if (currentZoom < 2.5) {
    currentZoom += 0.25;
    document.getElementById("previewImg").style.transform = `scale(${currentZoom})`;
  }
};

document.getElementById("zoomOutBtn").onclick = () => {
  if (currentZoom > 0.75) {
    currentZoom -= 0.25;
    document.getElementById("previewImg").style.transform = `scale(${currentZoom})`;
  }
};

document.getElementById("zoomResetBtn").onclick = () => {
  currentZoom = 1;
  document.getElementById("previewImg").style.transform = `scale(1)`;
};

// DELETE FILE
async function deleteFile(fileId, fileName) {
  const confirmed = confirm(`Are you sure you want to move this file to Google Drive Trash?\n\n${fileName}`);
  if (!confirmed) return;

  const res = await apiCall("deleteFile", { fileId }, "POST");
  if (res && res.success) {
    activeFiles = activeFiles.filter(f => f.id !== fileId);
    document.getElementById("fileCountBadge").innerText = `${activeFiles.length} Cards`;
    renderFileGrid(activeFiles);
    showToast("File moved to Google Drive Trash!");
  } else {
    showToast("Failed to delete file: " + (res.message || "Error"), true);
  }
}

// CSV EXPORT LOGIC
document.getElementById("exportCsvBtn").onclick = () => {
  if (!activeFiles || activeFiles.length === 0) {
    showToast("No student records to export", true);
    return;
  }
  let csv = "Roll Number,Branch,File Name,Drive ID\n";
  activeFiles.forEach(f => {
    const p = parseStudentId(f.name);
    csv += `"${p.rollNumber}","${p.branch}","${f.name}","${f.id}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SVGP_${currentFolderName}_Students.csv`;
  a.click();
  showToast(`Exported ${activeFiles.length} records!`);
};

// TOAST NOTIFICATIONS
function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  toastMsg.innerText = msg;
  toastIcon.className = isError ? "fa-solid fa-triangle-exclamation text-rose-400" : "fa-solid fa-circle-check text-emerald-400";
  
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 2800);
}

// DRAWER CONTROLS
function openDrawer() {
  document.getElementById("sidebarDrawer").classList.remove("-translate-x-full");
  document.getElementById("drawerBackdrop").classList.remove("hidden");
}

function closeDrawer() {
  document.getElementById("sidebarDrawer").classList.add("-translate-x-full");
  document.getElementById("drawerBackdrop").classList.add("hidden");
}

// CARD SIZE TOGGLE
document.getElementById("viewCompactBtn").onclick = () => {
  const grid = document.getElementById("fileGrid");
  grid.className = "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 transition-all";
  document.getElementById("viewCompactBtn").className = "px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-blue-950 shadow-xs";
  document.getElementById("viewStandardBtn").className = "px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 transition";
};

document.getElementById("viewStandardBtn").onclick = () => {
  const grid = document.getElementById("fileGrid");
  grid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 transition-all";
  document.getElementById("viewStandardBtn").className = "px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-blue-950 shadow-xs";
  document.getElementById("viewCompactBtn").className = "px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 transition";
};

// LISTENERS
function setupEventListeners() {
  document.getElementById("mobileMenuBtn").addEventListener("click", openDrawer);
  document.getElementById("closeDrawerBtn").addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", closeDrawer);

  document.getElementById("uploadModalOpenBtn").addEventListener("click", () => {
    document.getElementById("uploadModal").classList.remove("hidden");
  });

  document.getElementById("closeUploadModalBtn").addEventListener("click", closeUploadModal);
  document.getElementById("cancelUploadBtn").addEventListener("click", closeUploadModal);
  document.getElementById("closePreviewBtn").addEventListener("click", closePreviewModal);
  document.getElementById("refreshBtn").addEventListener("click", loadTree);

  // SEARCH INPUTS
  document.getElementById("searchInput").addEventListener("input", (e) => filterCards(e.target.value));
  document.getElementById("mobileSearchInput").addEventListener("input", (e) => filterCards(e.target.value));

  document.getElementById("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchDebounceTimer);
      performGlobalDriveSearch(e.target.value.trim());
    }
  });
  document.getElementById("mobileSearchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchDebounceTimer);
      performGlobalDriveSearch(e.target.value.trim());
    }
  });

  document.getElementById("clearSearchBtn").onclick = () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("mobileSearchInput").value = "";
    document.getElementById("clearSearchBtn").classList.add("hidden");
    document.getElementById("branchTagSubtitle").innerText = `Department of ${currentFolderName} • Live Drive Storage`;
    renderFileGrid(activeFiles);
    document.getElementById("fileCountBadge").innerText = `${activeFiles.length} Cards`;
  };

  // UPLOAD HANDLER
  document.getElementById("startUploadBtn").addEventListener("click", async () => {
    const picker = document.getElementById("filePicker");
    const files = picker.files;
    if (!files || files.length === 0) {
      showToast("Please select image files first", true);
      return;
    }

    const progressContainer = document.getElementById("uploadProgressContainer");
    const progressBar = document.getElementById("uploadProgressBar");
    const statusText = document.getElementById("uploadStatusText");

    progressContainer.classList.remove("hidden");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct = Math.round(((i) / files.length) * 100);
      progressBar.style.width = `${pct}%`;
      statusText.innerText = `Uploading: ${file.name}`;

      await uploadSingleFile(file);
    }

    progressBar.style.width = "100%";
    statusText.innerText = "Upload Complete!";
    showToast("Photos uploaded to Google Drive!");
    setTimeout(() => {
      closeUploadModal();
      selectFolder(currentFolderId, currentFolderName);
    }, 700);
  });
}

function closeUploadModal() {
  document.getElementById("uploadModal").classList.add("hidden");
  document.getElementById("uploadProgressContainer").classList.add("hidden");
  document.getElementById("uploadProgressBar").style.width = "0%";
  document.getElementById("filePicker").value = "";
}

function uploadSingleFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result.split(",")[1];
      await apiCall("uploadFile", {
        folderId: currentFolderId,
        fileName: file.name,
        mimeType: file.type,
        base64Data: base64Data
      }, "POST");
      resolve();
    };
    reader.readAsDataURL(file);
  });
}