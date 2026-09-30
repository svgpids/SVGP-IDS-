/**
 * QR Generator - 100% Scannable
 * Generates QR code that opens exactly: https://svgpids.github.io/SVGP-IDS-/scan.html
 */
(function() {
    'use strict';

    // ✅ EXACT TARGET URL
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
        statusText: document.getElementById('qr-status-text')
    };

    let qrInstance = null;

    function handleFileSelect(file) {
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('⚠️ Please upload JPG, PNG, or WEBP');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ File size exceeds 5 MB');
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

    function generateQRCode(data) {
        DOM.qrDisplay.innerHTML = '';
        DOM.placeholder.style.display = 'none';

        if (typeof QRCode === 'undefined') {
            DOM.placeholder.textContent = '❌ QR Library not loaded. Check internet.';
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
                correctLevel: QRCode.CorrectLevel.H
            });

            // Show URL below QR so user knows it's correct
            const urlText = document.createElement('p');
            urlText.textContent = TARGET_URL;
            urlText.style.marginTop = '15px';
            urlText.style.fontSize = '0.75rem';
            urlText.style.color = '#64748b';
            urlText.style.wordBreak = 'break-all';
            DOM.qrDisplay.appendChild(urlText);

            DOM.downloadBtn.disabled = false;
            DOM.statusText.textContent = '✅ QR Code Ready! Scan to open scan.html';
        } catch (error) {
            DOM.placeholder.textContent = '❌ Failed to generate QR.';
            DOM.placeholder.style.display = 'block';
        }
    }

    function downloadQR() {
        setTimeout(() => {
            const qrCanvas = DOM.qrDisplay.querySelector('canvas');
            const qrImg = DOM.qrDisplay.querySelector('img');
            const dataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : (qrImg ? qrImg.src : null);
            
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
    }

    function setupEvents() {
        DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
        DOM.selectBtn.addEventListener('click', () => DOM.fileInput.click());
        DOM.fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); });
        
        DOM.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); DOM.dropZone.classList.add('drag-over'); });
        DOM.dropZone.addEventListener('dragleave', () => DOM.dropZone.classList.remove('drag-over'));
        DOM.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        });

        DOM.downloadBtn.addEventListener('click', downloadQR);
        DOM.regenerateBtn.addEventListener('click', resetGenerator);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEvents);
    } else {
        setupEvents();
    }
})();