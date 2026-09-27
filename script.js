(function() {
    'use strict';

    const DOM = {
        dateEl: document.getElementById('current-date'),
        timeEl: document.getElementById('current-time'),
        navScan: document.getElementById('nav-scan'),
        navAdmin: document.getElementById('nav-admin'),
        navBranch: document.getElementById('nav-branch'),
        branchCards: document.querySelectorAll('.branch-card'),
        hamburgerBtn: document.getElementById('hamburger-btn')
    };

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
        
        DOM.dateEl.textContent = `${dayName}, ${date} ${month} ${year}`;
        DOM.timeEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }

    function setupNavigation() {
        if (DOM.navScan) {
            DOM.navScan.addEventListener('click', () => {
                window.location.href = 'scan.html';
            });
        }

        if (DOM.navAdmin) {
            DOM.navAdmin.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }

        if (DOM.navBranch) {
            DOM.navBranch.addEventListener('click', () => {
                window.location.href = 'branch.html';
            });
        }

        DOM.branchCards.forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = 'branch.html';
            });
        });

        // Hamburger Toggle
        if (DOM.hamburgerBtn) {
            DOM.hamburgerBtn.addEventListener('click', () => {
                DOM.hamburgerBtn.classList.toggle('active');
                // Menu open/close logic ivvalli (future)
                console.log('Menu toggled');
            });
        }
    }

    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        DOM.branchCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `all 0.4s ease ${index * 0.05}s`;
            observer.observe(card);
        });
    }

    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        setupNavigation();
        initScrollAnimations();
        console.log('✅ S.V. Government Polytechnic website initialized!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();