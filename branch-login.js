import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVNGyu0-xn52CEawJJNyZ3ZHm1jDbBfAQ",
  authDomain: "svgp-ids-018.firebaseapp.com",
  projectId: "svgp-ids-018",
  storageBucket: "svgp-ids-018.firebasestorage.app",
  messagingSenderId: "543712828116",
  appId: "1:543712828116:web:8ab3445c031d2edb723941"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const branchForm = document.getElementById("branchLoginForm");
const branchSelect = document.getElementById("branchSelect");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const statusMsg = document.getElementById("statusMsg");
const togglePass = document.getElementById("togglePass");
const loginBtn = document.getElementById("loginBtn");

togglePass.addEventListener("click", () => {
  const isPass = passwordInput.getAttribute("type") === "password";
  passwordInput.setAttribute("type", isPass ? "text" : "password");
  togglePass.classList.toggle("fa-eye", isPass);
  togglePass.classList.toggle("fa-eye-slash", !isPass);
});

branchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const branchId = branchSelect.value;
  const enteredUser = usernameInput.value.trim();
  const enteredPass = passwordInput.value.trim();

  statusMsg.style.color = "#6d28d9";
  statusMsg.textContent = "Verifying branch credentials...";
  loginBtn.disabled = true;

  try {
    // Reading from exact sub-collection: users -> admin -> branches -> {branchId}
    const docRef = doc(db, "users", "admin", "branches", branchId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.username === enteredUser && data.password === enteredPass) {
        statusMsg.style.color = "#16a34a";
        statusMsg.textContent = `Login Success! Loading ${data.username} portal...`;

        // Save session
        localStorage.setItem("activeBranchCode", data.username);
        localStorage.setItem("activeBranchId", branchId);

        setTimeout(() => {
          window.location.href = `branch-dashboard.html?branch=${branchId}`;
        }, 1000);
      } else {
        statusMsg.style.color = "#dc2626";
        statusMsg.textContent = "Invalid Branch Username or Password!";
        loginBtn.disabled = false;
      }
    } else {
      statusMsg.style.color = "#dc2626";
      statusMsg.textContent = "Branch details not found in Firebase!";
      loginBtn.disabled = false;
    }
  } catch (err) {
    statusMsg.style.color = "#dc2626";
    statusMsg.textContent = "Error: " + err.message;
    loginBtn.disabled = false;
  }
});