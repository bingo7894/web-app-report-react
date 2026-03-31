const STORAGE_PREFIX = "service-report:draft";
const DRAFT_VERSION = 1;

function getDraftKey(userEmail) {
  const normalizedUser = String(userEmail || "guest").trim().toLowerCase();
  return `${STORAGE_PREFIX}:${normalizedUser}`;
}

export function loadReportDraft(userEmail) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDraftKey(userEmail));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.version !== DRAFT_VERSION) {
      return null;
    }

    return parsed.payload || null;
  } catch {
    return null;
  }
}

export function saveReportDraft(userEmail, payload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getDraftKey(userEmail),
      JSON.stringify({
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        payload,
      }),
    );
  } catch {
    // ignore storage quota/private mode errors
  }
}

export function clearReportDraft(userEmail) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getDraftKey(userEmail));
  } catch {
    // ignore cleanup errors
  }
}
