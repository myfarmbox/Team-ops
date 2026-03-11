const ALL_APPS_SHEET_NAME = "ALL APPS";

function getAllAppsButtons_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(ALL_APPS_SHEET_NAME);
  if (!sh) throw new Error('Missing sheet: "ALL APPS"');

  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(normalizeAppHeader_);
  const rows = values.slice(1);

  const nameCol = findFirstAppCol_(headers, [
    "button",
    "button name",
    "app name",
    "name",
    "label"
  ]);
  const urlCol = findFirstAppCol_(headers, [
    "url",
    "button url",
    "app url",
    "link"
  ]);
  const keyCol = findFirstAppCol_(headers, [
    "key",
    "icon key",
    "app key"
  ]);
  const roleCol = findFirstAppCol_(headers, [
    "role",
    "roles",
    "access",
    "allowed role"
  ]);
  const activeCol = findFirstAppCol_(headers, [
    "active",
    "show",
    "enabled",
    "status"
  ]);

  if (nameCol === -1 || urlCol === -1) {
    throw new Error('Sheet "ALL APPS" must contain "BUTTON" or "Button Name", and "URL" columns.');
  }

  return rows
    .map((row) => {
      const label = String(row[nameCol] || "").trim();
      const url = String(row[urlCol] || "").trim();
      const key = keyCol === -1 ? "" : String(row[keyCol] || "").trim();
      const roles = roleCol === -1 ? "" : String(row[roleCol] || "").trim();
      const activeRaw = activeCol === -1 ? "" : String(row[activeCol] || "").trim().toLowerCase();

      if (!label || !url) return null;
      if (activeRaw && ["no", "false", "inactive", "hide", "hidden", "0"].includes(activeRaw)) {
        return null;
      }

      return {
        key: key || label,
        label,
        url,
        roles
      };
    })
    .filter(Boolean);
}

function getButtonsForRole_(role) {
  const roleName = String(role || "").trim().toUpperCase();
  const buttons = getAllAppsButtons_();

  return buttons.filter((btn) => {
    if (!btn.roles) return true;

    const allowed = String(btn.roles)
      .split(",")
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean);

    if (!allowed.length) return true;
    if (allowed.includes("ALL")) return true;
    return allowed.includes(roleName);
  });
}

function normalizeAppHeader_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findFirstAppCol_(headers, aliases) {
  for (let i = 0; i < aliases.length; i += 1) {
    const idx = headers.indexOf(aliases[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

/*
Drop-in usage inside your existing login/verifyPin response:

function verifyPin(pin) {
  const user = ... existing PIN lookup logic ...
  if (!user) return { ok: false, error: "Invalid PIN" };

  return {
    ok: true,
    user: {
      name: user.name,
      role: user.role
    },
    buttons: getButtonsForRole_(user.role)
  };
}

Recommended "ALL APPS" columns:
  BUTTON | URL | Key | Role | Active

Only "BUTTON" (or "Button Name") and "URL" are required.
If URL is blank, the frontend already hides that button.
If Role is blank, the button is shown to everyone.
*/
