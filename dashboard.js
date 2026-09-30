import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVNGyu0-xn52CEawJJNyZ3ZHm1jDbBfAQ",
  authDomain: "svgp-ids-018.firebaseapp.com",
  projectId: "svgp-ids-018",
  storageBucket: "svgp-ids-018.firebasestorage.app",
  messagingSenderId: "543712828116",
  appId: "1:543712828116:web:8ab3445c031d2edb723941",
  measurementId: "G-QG50SJBF92"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication Guard
const currentAdmin = localStorage.getItem("adminSession");
if (!currentAdmin) {
  window.location.href = "admin.html";
} else {
  const userTag = document.getElementById("currentUserDisplay");
  if (userTag) userTag.textContent = currentAdmin;
}

// Prefetch Registered Admin Email for Gmail Reset Modal
async function preloadAdminEmail() {
  try {
    const adminDoc = await getDoc(doc(db, "master_admin", "admin_profile"));
    if (adminDoc.exists() && adminDoc.data().email) {
      const emailField = document.getElementById("registeredEmailInput");
      if (emailField) emailField.value = adminDoc.data().email;
    }
  } catch (err) {
    console.warn("Could not prefetch email:", err);
  }
}
preloadAdminEmail();

// Profile Dropdown Toggle
const profileToggle = document.getElementById("profileToggle");
const dropdownMenu = document.getElementById("dropdownMenu");

if (profileToggle) {
  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });
}

document.addEventListener("click", () => {
  if (dropdownMenu) dropdownMenu.classList.remove("show");
});

// Logout Handler
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "admin.html";
});

// Module Navigation
window.openModule = (type) => {
  if (type === "qr") {
    window.location.href = "scan-qr.html";
  } else if (type === "branches") {
    window.location.href = "branches.html";
  }
};

// Modal Control Helpers
window.openModal = (modalId) => {
  document.getElementById(modalId).classList.add("active");
};

window.closeModal = (modalId) => {
  document.getElementById(modalId).classList.remove("active");
};

// 1. UPDATE ADMIN PASSWORD IN FIRESTORE
document.getElementById("btnUpdateAdminPass").addEventListener("click", async () => {
  const oldPass = document.getElementById("adminOldPass").value.trim();
  const newPass = document.getElementById("adminNewPass").value.trim();
  const confirmPass = document.getElementById("adminConfirmPass").value.trim();
  const statusDiv = document.getElementById("adminStatus");

  if (!oldPass || !newPass || !confirmPass) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "All fields are required!";
    return;
  }

  if (newPass !== confirmPass) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "New passwords do not match!";
    return;
  }

  statusDiv.style.color = "#ea580c";
  statusDiv.textContent = "Verifying & updating password...";

  try {
    const adminDocRef = doc(db, "master_admin", "admin_profile");
    const snap = await getDoc(adminDocRef);

    if (snap.exists() && snap.data().password === oldPass) {
      await updateDoc(adminDocRef, { password: newPass });
      statusDiv.style.color = "#16a34a";
      statusDiv.textContent = "Admin password updated successfully!";

      setTimeout(() => {
        closeModal("adminPassModal");
        document.getElementById("adminOldPass").value = "";
        document.getElementById("adminNewPass").value = "";
        document.getElementById("adminConfirmPass").value = "";
        statusDiv.textContent = "";
      }, 1400);
    } else {
      statusDiv.style.color = "#dc2626";
      statusDiv.textContent = "Current password incorrect!";
    }
  } catch (err) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "Error: " + err.message;
  }
});

// 2. UPDATE SUB-BRANCH PASSWORD IN FIRESTORE
document.getElementById("btnUpdateBranchPass").addEventListener("click", async () => {
  const branch = document.getElementById("branchSelect").value;
  const newPass = document.getElementById("branchNewPass").value.trim();
  const statusDiv = document.getElementById("branchStatus");

  if (!branch || !newPass) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "Select branch and enter new password!";
    return;
  }

  statusDiv.style.color = "#e11d48";
  statusDiv.textContent = `Updating password for ${branch}...`;

  try {
    const branchDocRef = doc(db, "branches", branch.toLowerCase());
    await setDoc(branchDocRef, {
      branchCode: branch,
      password: newPass,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    statusDiv.style.color = "#16a34a";
    statusDiv.textContent = `${branch} password updated successfully!`;

    setTimeout(() => {
      closeModal("branchPassModal");
      document.getElementById("branchSelect").value = "";
      document.getElementById("branchNewPass").value = "";
      statusDiv.textContent = "";
    }, 1400);
  } catch (err) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "Error: " + err.message;
  }
});

// 3. GMAIL PASSWORD RESET EMAIL
document.getElementById("btnSendResetEmail").addEventListener("click", async () => {
  const email = document.getElementById("registeredEmailInput").value.trim();
  const statusDiv = document.getElementById("emailResetStatus");

  if (!email || !email.includes("@")) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "Valid Gmail address enter cheyandi!";
    return;
  }

  statusDiv.style.color = "#2563eb";
  statusDiv.textContent = "Sending reset link...";

  try {
    await sendPasswordResetEmail(auth, email);
    statusDiv.style.color = "#16a34a";
    statusDiv.textContent = "Reset link sent to Gmail! Check your inbox.";

    setTimeout(() => {
      closeModal("gmailResetModal");
      statusDiv.textContent = "";
    }, 2000);
  } catch (error) {
    statusDiv.style.color = "#dc2626";
    statusDiv.textContent = "Error: " + error.message;
  }
});