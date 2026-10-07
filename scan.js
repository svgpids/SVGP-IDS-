/* =========================================================
   CONFIGURATION
========================================================= */
const API_URL = "https://script.google.com/macros/s/AKfycbxxpk0ldccr8Q4NDsle2xwY3Q7RO5xvEk31eMMz229HOC391ozZ1e_Y7NDlcUd7s8dAHA/exec";
const SCAN_PAGE = "https://svgpids.github.io/SVGP-IDS-/scan.html";

let scanner = null;
let scanning = false;

/* =========================================================
   LIVE CLOCK
========================================================= */
function refreshLiveClock() {
    const clockElement = document.getElementById("liveClock");
    if (!clockElement) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    const timeFormatted = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    clockElement.innerHTML = `${dateFormatted}<br>${timeFormatted}`;
}
setInterval(refreshLiveClock, 1000);
refreshLiveClock();

/* =========================================================
   EMPTY STATE (NO DUMMY CARD ON LOAD)
========================================================= */
function showEmptyState() {
    const container = document.getElementById("studentDisplayArea");
    container.innerHTML = `
        <div class="empty-placeholder">
            <div class="empty-icon-wrap">🪪</div>
            <h4>Waiting for ID Scan</h4>
            <p>Start the camera or upload an ID card image to generate verified student credentials.</p>
        </div>
    `;
}

/* =========================================================
   CAMERA MANAGEMENT
========================================================= */
async function toggleCamera() {
    if (scanning) {
        stopCamera();
    } else {
        startCamera();
    }
}

async function startCamera() {
    const screen = document.getElementById("scannerScreen");
    const label = document.getElementById("camLabel");
    const aim = document.getElementById("aimCenter");

    try {
        if (scanner) {
            try { await scanner.clear(); } catch (e) {}
            scanner = null;
        }

        scanner = new Html5Qrcode("reader");
        const config = {
            fps: 15,
            qrbox: { width: 220, height: 180 },
            aspectRatio: 1.3
        };

        await scanner.start(
            { facingMode: { exact: "environment" } },
            config,
            onBarcodeFound,
            () => {}
        );

        scanning = true;
        screen.classList.add("laser-active");
        label.textContent = "Stop Camera";
        if (aim) aim.style.display = "none";
    } catch (err) {
        try {
            scanner = new Html5Qrcode("reader");
            const config = { fps: 15, qrbox: { width: 220, height: 180 } };
            await scanner.start(
                { facingMode: "environment" },
                config,
                onBarcodeFound,
                () => {}
            );
            scanning = true;
            screen.classList.add("laser-active");
            label.textContent = "Stop Camera";
            if (aim) aim.style.display = "none";
        } catch (error) {
            alert("Camera permission denied or camera not accessible.");
        }
    }
}

async function stopCamera() {
    const screen = document.getElementById("scannerScreen");
    const label = document.getElementById("camLabel");
    const aim = document.getElementById("aimCenter");

    if (scanner && scanning) {
        try {
            await scanner.stop();
        } catch (e) {}
        scanning = false;
        screen.classList.remove("laser-active");
        label.textContent = "Use Camera";
        if (aim) aim.style.display = "block";
    }
}

async function onBarcodeFound(decodedText) {
    await stopCamera();

    const pin = extractPIN(decodedText);
    if (!pin) {
        showError("Invalid barcode/QR code scanned.");
        return;
    }
    verifyStudentWithAPI(pin);
}

function extractPIN(text) {
    const clean = String(text || "").trim();
    if (!clean) return "";

    try {
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            const url = new URL(clean);
            const pinParam = url.searchParams.get("pin");
            if (pinParam) return decodeURIComponent(pinParam).trim();
        }
    } catch (e) {}

    return clean;
}

/* =========================================================
   API VERIFICATION
========================================================= */
async function verifyStudentWithAPI(pin) {
    showLoading();

    try {
        const url = `${API_URL}?action=student&pin=${encodeURIComponent(pin)}&t=${Date.now()}`;
        const response = await fetch(url, { method: "GET", cache: "no-store" });
        if (!response.ok) throw new Error("HTTP Status: " + response.status);

        const data = await response.json();
        if (!data.success || !data.student) {
            showError("Student record not found or inactive.");
            return;
        }

        renderOfficialIDCard(data.student);
    } catch (err) {
        showError("Failed to connect to verification server.");
    }
}

/* =========================================================
   RENDER OFFICIAL STUDENT DIGITAL ID CARD FORM
========================================================= */
function renderOfficialIDCard(student) {
    const container = document.getElementById("studentDisplayArea");
    const pin = student.pin || "-";
    const studentName = student.name || student.studentName || student.fullName || pin;
    const branch = student.branch || "-";
    const year = student.year || "-";
    const photo = student.thumbnailUrl || "https://placehold.co/120x148/f1f5f9/475569?text=Student";
    const qrTarget = `${SCAN_PAGE}?pin=${encodeURIComponent(pin)}`;

    container.innerHTML = `
        <div class="official-id-card">
            <div class="id-card-header">
                <img src="images/logo.jpg" alt="SVGP Logo" class="id-college-logo" onerror="this.onerror=null; this.src='https://placehold.co/44x44/1e1b4b/ffffff?text=🏛';">
                <div class="id-header-titles">
                    <h4>S.V. GOVERNMENT POLYTECHNIC</h4>
                    <p>TIRUPATI &bull; ESTD. 1980 &bull; GOVT. OF ANDHRA PRADESH</p>
                </div>
            </div>

            <div class="id-card-body">
                <div class="id-photo-frame">
                    <img src="${escapeHtml(photo)}" alt="Student Photo" onerror="this.src='https://placehold.co/120x148/f1f5f9/475569?text=Student'">
                </div>

                <div class="id-info-col">
                    <h3>${escapeHtml(studentName)}</h3>

                    <div class="id-field-row">
                        <span class="field-icon">🆔</span>
                        <span class="field-lbl">PIN / Roll No.</span>
                        <span class="field-col">:</span>
                        <span class="field-val">${escapeHtml(pin)}</span>
                    </div>

                    <div class="id-field-row">
                        <span class="field-icon">🏢</span>
                        <span class="field-lbl">Branch</span>
                        <span class="field-col">:</span>
                        <span class="field-val">${escapeHtml(branch)}</span>
                    </div>

                    <div class="id-field-row">
                        <span class="field-icon">📅</span>
                        <span class="field-lbl">Year</span>
                        <span class="field-col">:</span>
                        <span class="field-val">${escapeHtml(year)}</span>
                    </div>
                </div>

                <div class="id-qr-box" id="idCardQrContainer"></div>
            </div>

            <div class="id-verified-strip">
                <span>✓ DIGITAL ID VERIFIED & ACTIVE</span>
                <button type="button" class="copy-pin-badge" onclick="copyPinToClip('${escapeHtml(pin)}')">Copy PIN</button>
            </div>

            <div class="id-card-footer">
                DEPARTMENT OF TECHNICAL EDUCATION &bull; ANDHRA PRADESH
            </div>
        </div>
    `;

    const qrContainer = document.getElementById("idCardQrContainer");
    new QRCode(qrContainer, {
        text: qrTarget,
        width: 80,
        height: 80,
        colorDark: "#070d24",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function showLoading() {
    document.getElementById("studentDisplayArea").innerHTML = `
        <div class="state-box">
            <div class="smooth-spinner"></div>
            <div class="state-title">Verifying ID...</div>
            <div class="state-desc">Connecting to institutional database</div>
        </div>
    `;
}

function showError(msg) {
    document.getElementById("studentDisplayArea").innerHTML = `
        <div class="state-box">
            <div style="font-size:32px; color:#ef4444; margin-bottom:10px;">✕</div>
            <div class="state-title" style="color:#b91c1c;">Verification Failed</div>
            <div class="state-desc">${escapeHtml(msg)}</div>
        </div>
    `;
}

function copyPinToClip(pin) {
    navigator.clipboard.writeText(pin).then(() => {
        alert("Student PIN copied: " + pin);
    }).catch(() => {});
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) handleImageFile(file);
    this.value = "";
});

async function handleImageFile(file) {
    if (!file.type.startsWith("image/")) {
        showError("Please upload a valid image file.");
        return;
    }
    showLoading();
    try {
        const localScanner = new Html5Qrcode("reader");
        const res = await localScanner.scanFile(file, true);
        try { await localScanner.clear(); } catch (e) {}

        if (res) {
            const pin = extractPIN(res);
            if (pin) verifyStudentWithAPI(pin);
            else showError("Barcode/QR detected, but no valid student PIN found.");
        }
    } catch (e) {
        showError("No readable barcode/QR found in the uploaded image.");
    }
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   INITIALIZATION
========================================================= */
showEmptyState();

const urlParams = new URLSearchParams(window.location.search);
const directPin = urlParams.get("pin");
if (directPin) {
    verifyStudentWithAPI(directPin);
}