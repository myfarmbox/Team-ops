const API = "https://script.google.com/macros/s/AKfycbxBI0SbhJVUAv0GM1OuhUN8vbcQVT-26uUPWbcjhIs1fRB-h6awdYZFwAQQSFibL4pKrg/exec";

async function login() {
  const pin = document.getElementById("pin").value;

  document.getElementById("status").innerText = "Checking PIN...";

  const res = await fetch(`${API}?action=login&pin=${encodeURIComponent(pin)}`);
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("status").innerText = "Invalid PIN";
    return;
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("apps").style.display = "block";

  document.getElementById("user").innerText = `${data.user.name} - ${data.user.role}`;

  data.buttons.forEach((btn) => {
    if (btn.key === "Harvest") {
      document.getElementById("harvest").href = btn.url;
    }

    if (btn.key === "WhatsApp") {
      document.getElementById("whatsapp").href = btn.url;
    }

    if (
      btn.key === "Orders" ||
      btn.key === "Consolidation" ||
      btn.key === "Orders - Consolidation" ||
      btn.label === "Consolidation" ||
      btn.label === "Orders - Consolidation" ||
      btn["Button Name"] === "Consolidation" ||
      btn["Button Name"] === "Orders - Consolidation"
    ) {
      document.getElementById("orders").href = btn.url;
    }

    if (btn.key === "Delivery") {
      document.getElementById("delivery").href = btn.url;
    }

    if (btn.key === "Attendance") {
      document.getElementById("attendance").href = btn.url;
    }
  });
}
