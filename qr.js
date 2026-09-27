/**
 * QR Generator - 100% Scannable & Bulletproof
 */
(function() {
    'use strict';

    // Exact URL to be encoded
    const TARGET_URL = "https://svgpids.github.io/SVGP-IDS-/scan.html";

    const DOM = {
        dropZone: document.getElementById('qr-drop-zone'),
        fileInput: document.getElementById('qr-file-input'),
        selectBtn: document.getElementById('qr-select-btn'),
        previewArea: document.getElementById('qr-preview-area'),
        previewImg: document.getElementById('qr-preview-img'),
        fileName: document.getElementById('qr-file-name'),
        qrDisplay: document.getElementById('qrcode'),
        placeholder: document.getElementById('qr-placeholder'),
        downloadBtn: document.getElementById('qr-download-btn'),
        regenerateBtn: document.getElementById('qr-regenerate-btn'),
        statusText: document.getElementById('qr-status-text'),
        dateEl: document.getElementById('qr-current-date'),
        timeEl: document.getElementById('qr-current-time')
    };

    let qrInstance = null;

    // 1. Live Clock
    function updateDateTime() {
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const dayName = days[now.getDay()];
        const date = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        
        if (DOM.dateEl) DOM.dateEl.textContent = `${dayName}, ${date} ${month} ${year}`;
        if (DOM.timeEl) DOM.timeEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }

    // 2. File Upload Handler
    function handleFileSelect(file) {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('⚠️ Please upload a valid image (JPG, PNG, or WEBP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ File size exceeds 5 MB limit');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.previewImg.src = e.target.result;
            DOM.fileName.textContent = file.name;
            DOM.previewArea.style.display = 'block';
            DOM.dropZone.style.display = 'none';
            DOM.selectBtn.style.display = 'none';

            // Generate QR with EXACT URL
            generateQRCode(TARGET_URL);
        };
        reader.readAsDataURL(file);
    }

    // 3. QR Code Generation (Bulletproof)
    function generateQRCode(data) {
        // Force clear previous QR code completely
        DOM.qrDisplay.innerHTML = '';
        DOM.placeholder.style.display = 'none';

        // Check if library is loaded
        if (typeof QRCode === 'undefined') {
            DOM.placeholder.textContent = '❌ QR Library not loaded. Check internet connection.';
            DOM.placeholder.style.display = 'block';
            return;
        }

        try {
            qrInstance = new QRCode(DOM.qrDisplay, {
                text: data,
                width: 250,
                height: 250,
                colorDark: "#000000", // Pure Black (Best for scanning)
                colorLight: "#ffffff", // Pure White
                correctLevel: QRCode.CorrectLevel.H // Highest error correction
            });

            // Add visible URL text below QR so you know what's inside
            const urlText = document.createElement('p');
            urlText.textContent = TARGET_URL;
            urlText.style.marginTop = '15px';
            urlText.style.fontSize = '0.8rem';
            urlText.style.color = '#64748b';
            urlText.style.wordBreak = 'break-all';
            DOM.qrDisplay.appendChild(urlText);

            DOM.downloadBtn.disabled = false;
            DOM.statusText.textContent = '✅ QR Code Ready! Scan to open scan.html';
            console.log('✅ QR Generated successfully with URL:', data);
        } catch (error) {
            console.error('QR Generation failed:', error);
            DOM.placeholder.textContent = '❌ Failed to generate QR.';
            DOM.placeholder.style.display = 'block';
        }
    }

    // 4. Download QR Code
    function downloadQR() {
        setTimeout(() => {
            const qrCanvas = DOM.qrDisplay.querySelector('canvas');
            const qrImg = DOM.qrDisplay.querySelector('img');

            let dataUrl;
            if (qrCanvas) {
                dataUrl = qrCanvas.toDataURL('image/png');
            } else if (qrImg) {
                dataUrl = qrImg.src;
            }

            if (dataUrl) {
                const link = document.createElement('a');
                link.download = 'svpg-qr-code.png';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }, 300);
    }

    // 5. Reset Generator
    function resetGenerator() {
        DOM.qrDisplay.innerHTML = '';
        DOM.placeholder.style.display = 'block';
        DOM.placeholder.textContent = 'Upload an image to generate QR code';
        DOM.previewArea.style.display = 'none';
        DOM.dropZone.style.display = 'block';
        DOM.selectBtn.style.display = 'flex';
        DOM.downloadBtn.disabled = true;
        DOM.statusText.textContent = 'Your QR code is ready!';
        DOM.fileInput.value = '';
        qrInstance = null;
    }

    // 6. Event Listeners
    function setupEventListeners() {
        DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
        DOM.selectBtn.addEventListener('click', () => DOM.fileInput.click());

        DOM.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFileSelect(e.target.files[0]);
        });

        DOM.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.dropZone.classList.add('drag-over');
        });
        DOM.dropZone.addEventListener('dragleave', () => {
            DOM.dropZone.classList.remove('drag-over');
        });
        DOM.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        });

        DOM.downloadBtn.addEventListener('click', downloadQR);
        DOM.regenerateBtn.addEventListener('click', resetGenerator);
    }

    // Initialize
    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        setupEventListeners();
        console.log('✅ QR Generator initialized!');
        console.log('📱 Target URL:', TARGET_URL);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();