/**
 * Scan Page - Student Details Logic
 * Reads URL parameters and displays student info dynamically
 */
(function() {
    'use strict';

    // Mock Database of Students (GitHub Pages lo database ledu kabatti idi use chesthunnamu)
    const studentDatabase = {
        '2026ECE001': {
            name: 'K. PRAVEEN KUMAR',
            branch: 'Electronics & Communication (ECE)',
            year: '1st Year',
            dob: '17-02-2007',
            batch: '2026 - 2029',
            blood: 'O +ve',
            photo: 'images/student.jpg'
        },
        '2026CIV002': {
            name: 'M. SURESH BABU',
            branch: 'Civil Engineering (DCE)',
            year: '1st Year',
            dob: '05-08-2006',
            batch: '2026 - 2029',
            blood: 'B +ve',
            photo: 'images/student.jpg'
        }
    };

    const DOM = {
        loading: document.getElementById('scan-loading'),
        card: document.getElementById('scan-student-card'),
        roll: document.getElementById('student-roll'),
        name: document.getElementById('student-name'),
        branchMain: document.getElementById('student-branch-main'),
        year: document.getElementById('student-year'),
        dob: document.getElementById('student-dob'),
        batch: document.getElementById('student-batch'),
        blood: document.getElementById('student-blood'),
        photo: document.getElementById('student-photo')
    };

    function loadStudentDetails() {
        // Get URL parameter (e.g., ?id=2026ECE001)
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id') || '2026ECE001'; // Default to 2026ECE001 if no ID

        // Simulate network delay for realistic feel
        setTimeout(() => {
            const student = studentDatabase[studentId];

            if (student) {
                // Update DOM with student data
                DOM.roll.textContent = studentId;
                DOM.name.textContent = student.name;
                DOM.branchMain.textContent = student.branch;
                DOM.year.textContent = student.year;
                DOM.dob.textContent = student.dob;
                DOM.batch.textContent = student.batch;
                DOM.blood.textContent = student.blood;
                DOM.photo.src = student.photo;

                // Show card, hide loading
                DOM.loading.style.display = 'none';
                DOM.card.style.display = 'block';
            } else {
                // If student not found
                DOM.loading.innerHTML = `
                    <div style="color: #ef4444; font-size: 3rem; margin-bottom: 10px;">⚠️</div>
                    <h3 style="color: #1e293b; margin-bottom: 8px;">Student Not Found</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">Invalid ID or data not available.</p>
                    <button class="scan-btn scan-btn-primary" onclick="window.location.href='index.html'">Go to Home</button>
                `;
            }
        }, 800); // 800ms fake loading time
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStudentDetails);
    } else {
        loadStudentDetails();
    }

})();