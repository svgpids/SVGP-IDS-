/**
 * Scan Page - Complete JavaScript
 * Handles: Clock, Upload, Camera, Navigation
 */
(function() {
    'use strict';

    // ===== DOM Cache =====
    const DOM = {
        dateEl: document.getElementById('scan-current-date'),
        timeEl: document.getElementById('scan-current-time'),
        uploadBtn: document.getElementById('scan-upload-btn'),
        cameraBtn: document.getElementById('scan-camera-btn'),
        hamburgerBtn: document.getElementById('scan-hamburger-btn')
    };

    // ===== Live Clock =====
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
        
        if (DOM.dateEl) {
            DOM.dateEl.textContent = `${dayName}, ${date} ${month} ${year}`;
        }
        if (DOM.timeEl) {
            DOM.timeEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
        }
    }

    // ===== Upload Image Handler =====
    function handleUpload() {
        if (!DOM.uploadBtn) return;

        DOM.uploadBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('📤 File uploaded:', file.name);
                    console.log('📊 Size:', (file.size / 1024).toFixed(2) + ' KB');
                    console.log('🎨 Type:', file.type);
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        console.log('✅ Image loaded, ready to scan barcode');
                    };
                    reader.readAsDataURL(file);
                    
                    alert('✅ Image uploaded: ' + file.name + '\n\nIn production, this will scan the barcode/QR automatically.');
                }
            };
            input.click();
        });
    }

    // ===== Camera Handler =====
    function handleCamera() {
        if (!DOM.cameraBtn) return;

        DOM.cameraBtn.addEventListener('click', () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                })
                .then(stream => {
                    console.log('📷 Camera accessed successfully');
                    alert('📷 Camera activated!\n\nIn production, this will show live camera feed with barcode scanning.');
                    
                    setTimeout(() => {
                        stream.getTracks().forEach(track => track.stop());
                        console.log('📷 Camera stopped');
                    }, 3000);
                })
                .catch(err => {
                    console.error('❌ Camera error:', err);
                    alert('❌ Camera access denied or not available.\n\nError: ' + err.message);
                });
            } else {
                alert('⚠️ Camera not supported in this browser.');
            }
        });
    }

    // ===== Hamburger Menu =====
    function handleHamburger() {
        if (!DOM.hamburgerBtn) return;

        DOM.hamburgerBtn.addEventListener('click', () => {
            DOM.hamburgerBtn.classList.toggle('active');
            console.log('🍔 Menu toggled');
        });
    }

    // ===== Scan Animation Enhancement =====
    function enhanceScanner() {
        const scannerArea = document.querySelector('.scan-scanner-area');
        if (!scannerArea) return;

        scannerArea.addEventListener('click', () => {
            console.log('🎯 Scan triggered manually');
            scannerArea.style.boxShadow = '0 0 30px #a855f7';
            setTimeout(() => {
                scannerArea.style.boxShadow = 'none';
            }, 300);
        });
    }

    // ===== Initialization =====
    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        handleUpload();
        handleCamera();
        handleHamburger();
        enhanceScanner();
        
        console.log('✅ Scan page initialized successfully!');
        console.log('📱 Ready to scan student ID cards');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();