import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const loginForm = document.getElementById("adminLoginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const statusMsg = document.getElementById("statusMsg");
const togglePass = document.getElementById("togglePassword");
const forgotBtn = document.getElementById("forgotBtn");

// Modal Elements
const loginResetModal = document.getElementById("loginResetModal");
const closeResetModal = document.getElementById("closeResetModal");
const btnSendResetLink = document.getElementById("btnSendResetLink");
const resetEmailInput = document.getElementById("resetEmailInput");
const resetModalStatus = document.getElementById("resetModalStatus");

// Toggle Password
togglePass.addEventListener("click", () => {
  const isPass = passwordInput.getAttribute("type") === "password";
  passwordInput.setAttribute("type", isPass ? "text" : "password");
  togglePass.classList.toggle("fa-eye", isPass);
  togglePass.classList.toggle("fa-eye-slash", !isPass);
});

// Forgot Password Modal Controls
forgotBtn.addEventListener("click", (e) => {
  e.preventDefault();
  loginResetModal.classList.add("active");
});

closeResetModal.addEventListener("click", () => {
  loginResetModal.classList.remove("active");
  resetModalStatus.textContent = "";
});

// Send Reset Link via Gmail
btnSendResetLink.addEventListener("click", async () => {
  const email = resetEmailInput.value.trim();
  if (!email || !email.includes("@")) {
    resetModalStatus.style.color = "#dc2626";
    resetModalStatus.textContent = "Please enter a valid Gmail address!";
    return;
  }

  resetModalStatus.style.color = "#6366f1";
  resetModalStatus.textContent = "Sending reset link...";

  try {
    await sendPasswordResetEmail(auth, email);
    resetModalStatus.style.color = "#16a34a";
    resetModalStatus.textContent = "Reset link sent! Check your Gmail inbox/spam.";
    setTimeout(() => {
      loginResetModal.classList.remove("active");
      resetEmailInput.value = "";
      resetModalStatus.textContent = "";
    }, 2500);
  } catch (err) {
    resetModalStatus.style.color = "#dc2626";
    resetModalStatus.textContent = "Failed: " + err.message;
  }
});

// Login Execution
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const enteredUser = usernameInput.value.trim();
  const enteredPass = passwordInput.value.trim();

  statusMsg.style.color = "#4f46e5";
  statusMsg.textContent = "Verifying credentials...";
  submitBtn.disabled = true;

  try {
    // 1. Direct verify: master_admin/admin_profile
    let docRef = doc(db, "master_admin", "admin_profile");
    let docSnap = await getDoc(docRef);

    let isValid = false;
    let loggedUser = null;

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (
        data.username && data.username.toString().trim() === enteredUser &&
        data.password && data.password.toString().trim() === enteredPass
      ) {
        isValid = true;
        loggedUser = data.username;
      }
    }

    // 2. Direct verify: users/{enteredUser}
    if (!isValid) {
      docRef = doc(db, "users", enteredUser);
      docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const uData = docSnap.data();
        if (
          uData.password && uData.password.toString().trim() === enteredPass &&
          (uData.role === "master_admin" || uData.role === "admin")
        ) {
          isValid = true;
          loggedUser = uData.username;
        }
      }
    }

    if (isValid) {
      statusMsg.style.color = "#16a34a";
      statusMsg.textContent = "Login Successful! Loading Dashboard...";

      localStorage.setItem("adminSession", loggedUser);
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      statusMsg.style.color = "#dc2626";
      statusMsg.textContent = "Invalid Username or Password!";
      submitBtn.disabled = false;
    }
  } catch (err) {
    statusMsg.style.color = "#dc2626";
    statusMsg.textContent = "Connection error: " + err.message;
    submitBtn.disabled = false;
  }
});