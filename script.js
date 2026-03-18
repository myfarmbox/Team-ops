const TOOL_META = {
  Harvest: { label: "Harvest", desc: "Weekly harvest flow", icon: "icons/harvest.svg", cls: "i-green" },
  WhatsApp: { label: "WhatsApp", desc: "Templates & customer updates", icon: "icons/whatsapp.svg", cls: "i-teal" },
  Orders: { label: "Consolidation", desc: "Combine orders into one list", icon: "icons/consolidation.svg", cls: "i-navy" },
  Delivery: { label: "Delivery", desc: "Live delivery operations", icon: "icons/delivery.svg", cls: "i-gold" },
  Attendance: { label: "Attendance", desc: "Team attendance tracking", icon: "icons/attendance.svg", cls: "i-earth" },
  Members: { label: "MFB Members Data", desc: "Member records & info", icon: "icons/members.svg", cls: "i-green" },
  Website: { label: "Website List update", desc: "Update website list", icon: "icons/website.svg", cls: "i-teal" },
  FarmPickup: { label: "Farm Pickup", desc: "Pickup verification & flow", icon: "icons/farm_pickup.svg", cls: "i-green" }
};

function normalizeToolKey(key) {
  const map = {
    Harvest: "Harvest",
    WhatsApp: "WhatsApp",
    Orders: "Orders",
    "Order Consolidation": "Orders",
    Consolidation: "Orders",
    Delivery: "Delivery",
    "Delivery Console": "Delivery",
    Attendance: "Attendance",
    Members: "Members",
    "MFB Members Data": "Members",
    Website: "Website",
    "Website List update": "Website",
    "Website List Update": "Website",
    "Farm Pickup": "FarmPickup",
    FarmPickup: "FarmPickup"
  };
  return map[key] || key;
}

function toolMeta(btn) {
  const key = normalizeToolKey(btn.key || btn.label || "");
  return TOOL_META[key] || {
    label: btn.label || "Tool",
    desc: "Open linked application",
    icon: "icons/website.svg",
    cls: "i-green"
  };
}

function renderButtons(buttons) {
  toolsGrid.innerHTML = "";
  if (!buttons || !buttons.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  buttons.forEach((btn) => {
    const meta = toolMeta(btn);
    const label = btn.label && btn.label !== btn.key ? btn.label : meta.label;
    const card = document.createElement("a");
    card.href = btn.url;
    card.className = "tool-card";
    card.target = "_blank";
    card.rel = "noopener";
    card.innerHTML = `
      <div class="tool-icon ${meta.cls}">
        <img src="${meta.icon}" alt="${label}" style="width:24px;height:24px;display:block;" />
      </div>
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
