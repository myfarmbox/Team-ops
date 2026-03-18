const LOGIN_API = "https://script.google.com/macros/s/AKfycbxBI0SbhJVUAv0GM1OuhUN8vbcQVT-26uUPWbcjhIs1fRB-h6awdYZFwAQQSFibL4pKrg/exec";
const SESSION_KEY = "mfb_internal_app_session";
const SESSION_AGE_MS = 8 * 60 * 60 * 1000;
const AUTO_PIN_LENGTH = 4;

let deferredPrompt = null;
let autoLoginTimer = null;
let isLoggingIn = false;

const TOOL_META = {
  Harvest: { label: "Harvest", icon: "icons/harvest.svg", cls: "i-green" },
  WhatsApp: { label: "WhatsApp", icon: "icons/whatsapp.svg", cls: "i-teal" },
  Orders: { label: "Consolidation", icon: "icons/consolidation.svg", cls: "i-navy" },
  Consolidation: { label: "Consolidation", icon: "icons/consolidation.svg", cls: "i-navy" },
  "Order Consolidation": { label: "Consolidation", icon: "icons/consolidation.svg", cls: "i-navy" },
  "Orders - Consolidation": { label: "Orders - Consolidation", icon: "icons/consolidation.svg", cls: "i-navy" },
  "Phone Orders": { label: "Phone Orders", icon: "icons/consolidation.svg", cls: "i-earth" },
  Delivery: { label: "Delivery", icon: "icons/delivery.svg", cls: "i-gold" },
  "Delivery Console": { label: "Delivery", icon: "icons/delivery.svg", cls: "i-gold" },
  Attendance: { label: "Attendance", icon: "icons/attendance.svg", cls: "i-earth" },
  Members: { label: "MFB Members Data", icon: "icons/members.svg", cls: "i-navy" },
  "MFB Members Data": { label: "MFB Members Data", icon: "icons/members.svg", cls: "i-navy" },
  "MyFarmBox Master data": { label: "MyFarmBox Master data", icon: "icons/members.svg", cls: "i-navy" },
  "Farm Pickup": { label: "Farm Pickup", icon: "icons/farm_pickup.svg", cls: "i-green" },
  FarmPickup: { label: "Farm Pickup", icon: "icons/farm_pickup.svg", cls: "i-green" },
  Website: { label: "Website List update", icon: "icons/website.svg", cls: "i-teal" },
  "Website List update": { label: "Website List update", icon: "icons/website.svg", cls: "i-teal" },
  "Website List Update": { label: "Website List update", icon: "icons/website.svg", cls: "i-teal" }
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
const quickSection = document.getElementById("quickSection");
const pinDots = Array.from(document.querySelectorAll(".pin-dot"));
const keypadButtons = Array.from(document.querySelectorAll(".numpad-key"));

setTimeout(() => {
  if (bootLoader) bootLoader.classList.add("hidden");
}, 900);

function updateClock() {
  const clock = document.getElementById("clock");
  const dateLine = document.getElementById("dateLine");
  const now = new Date();

  if (clock) {
    clock.textContent = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (dateLine) {
    dateLine.textContent = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short"
    }).toUpperCase();
  }
}

updateClock();
setInterval(updateClock, 1000);

function showOverlay(message) {
  if (!overlay || !overlayLabel) return;
  overlayLabel.textContent = message || "Loading";
  overlay.classList.add("show");
}

function hideOverlay() {
  if (!overlay) return;
  overlay.classList.remove("show");
}

function showToast(message, type = "normal") {
  if (!statusToast || !statusText) return;

  statusText.textContent = message;
  statusToast.classList.remove("success", "error");

  if (type === "success") statusToast.classList.add("success");
  if (type === "error") statusToast.classList.add("error");

  statusToast.classList.add("show");
}

function hideToast(delay = 1200) {
  if (!statusToast) return;

  setTimeout(() => {
    statusToast.classList.remove("show", "success", "error");
  }, delay);
}

function setError(message) {
  if (!errorText) return;
  errorText.textContent = message || "";
}

function saveSession(payload) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      ts: Date.now(),
      payload
    })
  );
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

function normalizeToolKey(key) {
  const map = {
    Harvest: "Harvest",
    WhatsApp: "WhatsApp",
    Orders: "Orders",
    Consolidation: "Consolidation",
    "Order Consolidation": "Order Consolidation",
    "Orders - Consolidation": "Orders - Consolidation",
    "Phone Orders": "Phone Orders",
    Delivery: "Delivery",
    "Delivery Console": "Delivery Console",
    Attendance: "Attendance",
    Members: "Members",
    "MFB Members Data": "MFB Members Data",
    "MyFarmBox Master data": "MyFarmBox Master data",
    "Farm Pickup": "Farm Pickup",
    FarmPickup: "FarmPickup",
    Website: "Website",
    "Website List update": "Website List update",
    "Website List Update": "Website List Update"
  };

  return map[key] || key;
}

function toolMeta(btn) {
  const key = normalizeToolKey(btn.key || btn.label || "");

  return TOOL_META[key] || {
    label: btn.label || "Tool",
    icon: "icons/website.svg",
    cls: "i-green"
  };
}

function normalizeButtons(buttons) {
  if (!Array.isArray(buttons)) return [];

  return buttons
    .map((btn) => {
      const url = String(
        btn.url ||
        btn.URL ||
        btn.link ||
        btn.Link ||
        btn["App URL"] ||
        btn["Button URL"] ||
        ""
      ).trim();

      const label = String(
        btn.label ||
        btn.name ||
        btn.key ||
        btn.button ||
        btn.BUTTON ||
        btn.buttonName ||
        btn.ButtonName ||
        btn["Button Name"] ||
        btn["App Name"] ||
        ""
      ).trim();

      if (!url || !label) return null;

      return {
        ...btn,
        url,
        label
      };
    })
    .filter(Boolean);
}

function ripple(el, evt) {
  if (!el || !evt) return;

  const rect = el.getBoundingClientRect();
  const node = document.createElement("span");
  const size = Math.max(rect.width, rect.height);

  node.className = "ripple";
  node.style.width = `${size}px`;
  node.style.height = `${size}px`;
  node.style.left = `${evt.clientX - rect.left - size / 2}px`;
  node.style.top = `${evt.clientY - rect.top - size / 2}px`;

  el.appendChild(node);

  setTimeout(() => {
    node.remove();
  }, 600);
}

function syncPinDots() {
  const pin = pinInput ? pinInput.value.trim() : "";

  pinDots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < pin.length);
    dot.classList.toggle("active", index === pin.length && pin.length < pinDots.length);
  });
}

function clearAutoLoginTimer() {
  if (!autoLoginTimer) return;
  clearTimeout(autoLoginTimer);
  autoLoginTimer = null;
}

function pulsePinError() {
  if (!loginCard) return;

  loginCard.classList.remove("shake");
  void loginCard.offsetWidth;
  loginCard.classList.add("shake");
}

function queueAutoLogin() {
  clearAutoLoginTimer();

  if (isLoggingIn) return;
  if (!pinInput) return;
  if (pinInput.value.trim().length < AUTO_PIN_LENGTH) return;

  autoLoginTimer = setTimeout(() => {
    handleLogin();
  }, 320);
}

function setPinValue(nextValue) {
  if (!pinInput) return;

  pinInput.value = nextValue.slice(0, 12);
  setError("");
  syncPinDots();
  queueAutoLogin();
}

function bindTool(card, label, url) {
  card.addEventListener("click", (evt) => {
    evt.preventDefault();
    ripple(card, evt);

    if (footerStatus) {
      footerStatus.textContent = "Opening " + label;
    }

    showOverlay("Opening");
    showToast("Loading " + label + "...");

    setTimeout(() => {
      window.open(url, "_blank", "noopener");
      hideOverlay();

      if (footerStatus) {
        footerStatus.textContent = "Tools ready";
      }

      showToast(label + " opened", "success");
      hideToast(1200);
    }, 220);
  });
}

function renderButtons(buttons) {
  if (!toolsGrid || !emptyState) return;

  const visibleButtons = normalizeButtons(buttons);
  toolsGrid.innerHTML = "";

  if (!visibleButtons.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  visibleButtons.forEach((btn) => {
    const meta = toolMeta(btn);
    const label = btn.label && btn.label !== btn.key ? btn.label : meta.label;

    const card = document.createElement("a");
    card.href = btn.url;
    card.className = "tool-card";
    if (meta.cls) card.classList.add(meta.cls);
    card.target = "_blank";
    card.rel = "noopener";
    card.setAttribute("aria-label", label);

    card.innerHTML = `
      <div class="tool-icon">
        <img src="${meta.icon}" alt="${label}" />
      </div>
      <div class="tool-title">${label}</div>
    `;

    bindTool(card, label, btn.url);
    toolsGrid.appendChild(card);
  });
}

function showLoggedIn(user, buttons) {
  if (loginCard) loginCard.classList.add("hidden");
  if (userCard) userCard.classList.remove("hidden");
  if (quickSection) quickSection.classList.remove("hidden");

  if (userName) {
    userName.textContent = user.name || "Team User";
  }

  if (userRole) {
    userRole.textContent = user.role || "Access active";
  }

  if (footerStatus) {
    footerStatus.textContent = "Secure session active";
  }

  renderButtons(buttons || []);
}

function showLoggedOut() {
  clearAutoLoginTimer();

  if (loginCard) loginCard.classList.remove("hidden");
  if (userCard) userCard.classList.add("hidden");
  if (quickSection) quickSection.classList.add("hidden");
  if (toolsGrid) toolsGrid.innerHTML = "";
  if (emptyState) emptyState.classList.add("hidden");
  if (footerStatus) footerStatus.textContent = "Awaiting secure login";

  setPinValue("");
}

function setLoggingState(active) {
  isLoggingIn = active;

  document.querySelectorAll(".numpad-key").forEach((button) => {
    button.disabled = active;
  });
}

function applyKey(value) {
  if (isLoggingIn || !pinInput) return;

  if (value === "clear") {
    setPinValue("");
    return;
  }

  if (value === "backspace") {
    setPinValue(pinInput.value.slice(0, -1));
    return;
  }

  if (!/^\\d$/.test(String(value)) || pinInput.value.length >= 12) return;

  setPinValue(pinInput.value + String(value));
}

async function fetchLogin(pin) {
  const url = LOGIN_API + "?action=login&pin=" + encodeURIComponent(pin);
  const res = await fetch(url, {
    method: "GET",
    mode: "cors"
  });

  if (!res.ok) {
    throw new Error("Network error");
  }

  return await res.json();
}

async function handleLogin() {
  if (!pinInput) return;

  const pin = pinInput.value.trim();

  if (!pin || isLoggingIn) {
    if (!pin) {
      setError("Enter PIN");
      showToast("Enter PIN", "error");
      hideToast();
      pulsePinError();
    }
    return;
  }

  clearAutoLoginTimer();
  setLoggingState(true);
  setError("");
  showOverlay("Authenticating");
  showToast("Verifying PIN...");

  try {
    const data = await fetchLogin(pin);

    if (!data || !data.ok) {
      const message = data && data.error ? data.error : "Invalid PIN";
      setError(message);
      showToast(message, "error");
      hideOverlay();
      hideToast(1600);
      pulsePinError();
      setLoggingState(false);
      return;
    }

    const payload = {
      user: data.user || {},
      buttons: Array.isArray(data.buttons) ? data.buttons : []
    };

    saveSession(payload);
    showLoggedIn(payload.user, payload.buttons);
    hideOverlay();
    showToast("Ready", "success");
    hideToast();
    setLoggingState(false);
  } catch {
    setError("Unable to connect");
    hideOverlay();
    showToast("Unable to connect", "error");
    hideToast(1600);
    pulsePinError();
    setLoggingState(false);
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearSession();
    showLoggedOut();
  });
}

if (pinInput) {
  pinInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearAutoLoginTimer();
      handleLogin();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      applyKey("backspace");
      return;
    }

    if (/^\\d$/.test(event.key)) {
      event.preventDefault();
      applyKey(event.key);
    }
  });

  pinInput.addEventListener("input", () => {
    setPinValue(pinInput.value.replace(/\\D/g, ""));
  });
}

keypadButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    ripple(button, event);

    const rawKey =
      button.dataset.key ||
      (button.id === "clearBtn" ? "clear" : "") ||
      (button.id === "loginBtn" ? "go" : "") ||
      button.textContent.trim();

    const key = String(rawKey).toLowerCase();

    if (key === "go") {
      clearAutoLoginTimer();
      handleLogin();
      return;
    }

    if (key === "clear") {
      applyKey("clear");
      return;
    }

    applyKey(rawKey);
  });
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

  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
  });
}

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

syncPinDots();
