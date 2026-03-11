const LOGIN_API = "https://script.google.com/macros/s/AKfycbxBI0SbhJVUAv0GM1OuhUN8vbcQVT-26uUPWbcjhIs1fRB-h6awdYZFwAQQSFibL4pKrg/exec";
const SESSION_KEY = "mfb_internal_app_session";
const SESSION_AGE_MS = 8 * 60 * 60 * 1000;

let deferredPrompt = null;

const TOOL_META = {
  Harvest: { label: "Harvest Generator", desc: "Weekly harvest flow & farm-wise lists", icon: "🌾", cls: "i-green" },
  WhatsApp: { label: "WhatsApp", desc: "Templates & customer updates", icon: "💬", cls: "i-teal" },
  Orders: { label: "Order Consolidation", desc: "Combine orders into one clean list", icon: "🧾", cls: "i-navy" },
  Consolidation: { label: "Consolidation", desc: "Combine orders into one clean list", icon: "🧾", cls: "i-navy" },
  "Orders - Consolidation": { label: "Orders - Consolidation", desc: "Combine orders into one clean list", icon: "🧾", cls: "i-navy" },
  "Phone Orders": { label: "Phone Orders", desc: "Handle inbound phone-based orders", icon: "📞", cls: "i-earth" },
  Delivery: { label: "Delivery Console", desc: "Live delivery ops & tracking", icon: "🚚", cls: "i-gold" },
  Attendance: { label: "Attendance", desc: "Daily team attendance tracking", icon: "👨‍🌾", cls: "i-earth" },
  "MFB Members Data": { label: "MFB Members Data", desc: "Master member records and updates", icon: "👥", cls: "i-navy" },
  "MyFarmBox Master data": { label: "MyFarmBox Master data", desc: "Master member records and updates", icon: "👥", cls: "i-navy" }
};

const bootLoader = document.getElementById("bootLoader");
const overlay = document.getElementById("overlay");
const overlayLabel = document.getElementById("overlayLabel");
const statusToast = document.getElementById("statusToast");
const statusText = document.getElementById("statusText");
const loginCard = document.getElementById("loginCard");
const userCard = document.getElementById("userCard");
const toolsGrid = document.getElementById("toolsGrid");
const emptyState = document.getElementById("emptyState");
const pinInput = document.getElementById("pinInput");
const loginBtn = document.getElementById("loginBtn");
const clearBtn = document.getElementById("clearBtn");
const logoutBtn = document.getElementById("logoutBtn");
const errorText = document.getElementById("errorText");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const footerStatus = document.getElementById("footerStatus");
const installBtn = document.getElementById("installBtn");

setTimeout(() => bootLoader.classList.add("hidden"), 1600);

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  document.getElementById("dateLine").textContent =
    now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
}

updateClock();
setInterval(updateClock, 1000);

function showOverlay(message) {
  overlayLabel.textContent = message || "Loading";
  overlay.classList.add("show");
}

function hideOverlay() {
  overlay.classList.remove("show");
}

function showToast(message, type = "normal") {
  statusText.textContent = message;
  statusToast.classList.remove("success", "error");
  if (type === "success") statusToast.classList.add("success");
  if (type === "error") statusToast.classList.add("error");
  statusToast.classList.add("show");
}

function hideToast(delay = 1200) {
  setTimeout(() => statusToast.classList.remove("show", "success", "error"), delay);
}

function setError(message) {
  errorText.textContent = message || "";
}

function saveSession(payload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now(), payload }));
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.ts || Date.now() - parsed.ts > SESSION_AGE_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed.payload || null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function toolMeta(btn) {
  return TOOL_META[btn.key] || TOOL_META[btn.label] || {
    label: btn.label || "Tool",
    desc: "Open linked application",
    icon: "↗",
    cls: "i-green"
  };
}

function normalizeButtons(buttons) {
  if (!Array.isArray(buttons)) return [];

  return buttons
    .map((btn) => {
      const url = (
        btn.url ||
        btn.URL ||
        btn.link ||
        btn.Link ||
        btn["App URL"] ||
        btn["Button URL"] ||
        ""
      ).trim();

      const label = (
        btn.label ||
        btn.name ||
        btn.key ||
        btn.buttonName ||
        btn.ButtonName ||
        btn["Button Name"] ||
        btn["App Name"] ||
        ""
      ).trim();

      if (!url || !label) return null;
      return { ...btn, url, label };
    })
    .filter(Boolean);
}

function ripple(el, evt) {
  const rect = el.getBoundingClientRect();
  const node = document.createElement("span");
  node.className = "ripple";
  const size = Math.max(rect.width, rect.height);
  node.style.width = size + "px";
  node.style.height = size + "px";
  node.style.left = evt.clientX - rect.left - size / 2 + "px";
  node.style.top = evt.clientY - rect.top - size / 2 + "px";
  el.appendChild(node);
  setTimeout(() => node.remove(), 600);
}

function bindTool(card, label, url) {
  card.addEventListener("click", (evt) => {
    evt.preventDefault();
    ripple(card, evt);
    footerStatus.textContent = "Opening " + label;
    showOverlay("Opening");
    showToast("Loading " + label + "...");
    setTimeout(() => {
      window.open(url, "_blank", "noopener");
      hideOverlay();
      footerStatus.textContent = "Tools ready";
      showToast(label + " opened", "success");
      hideToast(1300);
    }, 260);
  });
}

function renderButtons(buttons) {
  const visibleButtons = normalizeButtons(buttons);
  toolsGrid.innerHTML = "";
  if (!visibleButtons.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  visibleButtons.forEach((btn, index) => {
    const meta = toolMeta(btn);
    const label = btn.label && btn.label !== btn.key ? btn.label : meta.label;
    const card = document.createElement("a");
    card.href = btn.url;
    card.className = "tool-card";
    card.target = "_blank";
    card.rel = "noopener";
    card.style.setProperty("--delay", `${index * 70}ms`);
    card.setAttribute("aria-label", label);
    card.innerHTML = `
      <div class="tool-icon ${meta.cls}">${meta.icon}</div>
      <div class="tool-copy">
        <div class="tool-title">${label}</div>
        <div class="tool-desc">${btn.desc || meta.desc}</div>
      </div>
      <div class="tool-arrow">›</div>
    `;
    bindTool(card, label, btn.url);
    toolsGrid.appendChild(card);
  });
}

function showLoggedIn(user, buttons) {
  loginCard.classList.add("hidden");
  userCard.classList.remove("hidden");
  userName.textContent = user.name || "Team User";
  userRole.textContent = user.role ? user.role + " access active" : "Role based tools loaded";
  footerStatus.textContent = user.role ? user.role + " tools live" : "Secure session active";
  renderButtons(buttons || []);
}

function showLoggedOut() {
  loginCard.classList.remove("hidden");
  userCard.classList.add("hidden");
  toolsGrid.innerHTML = "";
  emptyState.classList.add("hidden");
  footerStatus.textContent = "Awaiting secure login";
  pinInput.value = "";
  setError("");
}

async function fetchLogin(pin) {
  const url = LOGIN_API + "?action=login&pin=" + encodeURIComponent(pin);
  const res = await fetch(url, { method: "GET", mode: "cors" });
  if (!res.ok) throw new Error("Network error");
  return await res.json();
}

async function handleLogin() {
  const pin = pinInput.value.trim();
  if (!pin) {
    setError("Enter PIN");
    showToast("Enter PIN", "error");
    hideToast();
    pinInput.focus();
    return;
  }

  setError("");
  showOverlay("Authenticating");
  showToast("Verifying PIN...");

  try {
    showToast("Connecting...");
    const data = await fetchLogin(pin);
    showToast("Reading access...");

    if (!data || !data.ok) {
      const message = data && data.error ? data.error : "Invalid PIN";
      setError(message);
      showToast(message, "error");
      hideOverlay();
      hideToast(1800);
      return;
    }

    const payload = {
      user: data.user || {},
      buttons: Array.isArray(data.buttons) ? data.buttons : []
    };

    saveSession(payload);
    showToast("Loading tools...");
    showLoggedIn(payload.user, payload.buttons);
    hideOverlay();
    showToast("Ready", "success");
    hideToast();
  } catch {
    setError("Unable to connect");
    hideOverlay();
    showToast("Unable to connect", "error");
    hideToast(1800);
  }
}

loginBtn.addEventListener("click", handleLogin);
clearBtn.addEventListener("click", () => {
  pinInput.value = "";
  setError("");
  pinInput.focus();
});
logoutBtn.addEventListener("click", () => {
  clearSession();
  showLoggedOut();
});

pinInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleLogin();
});

document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    showToast("Opening...", "success");
    hideToast(1000);
  });
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

const session = getSession();
if (session && session.user) {
  showLoggedIn(session.user, session.buttons || []);
} else {
  showLoggedOut();
}
