const EN = new Set(["yes","yes please","correct","that's correct","that is correct","right","that's right","confirm","confirmed"])
const TE = new Set(["అవును","అవును అండి","సరే","సరే అండి","కరెక్ట్","కరెక్ట్ అండి","నిజమే","నిర్ధారించండి","కన్ఫర్మ్"])
const MIXED = new Set(["yes అండి","yes andi","correct అండి","correct andi","అవును correct","అవును కన్ఫర్మ్","sare correct","సరే correct","confirm అండి","confirm andi"])

export function normalizeConfirmation(text="") { return String(text).trim().toLocaleLowerCase().replace(/[.!?,।]+$/gu, "").replace(/\s+/gu, " ") }
export function isExplicitMemoryAffirmative(text="", language="en") {
  const value = normalizeConfirmation(text)
  if (language === "te" && (TE.has(value) || MIXED.has(value))) return true
  if (language === "en" && EN.has(value)) return true
  // Code-switched callers are allowed only when they use an enumerated form.
  return MIXED.has(value)
}
