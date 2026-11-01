/**
 * Cheap, code-level backstop for prompt injection in untrusted GitHub issue content.
 * Not a replacement for the prompting rules in knowledge/aturan-keamanan.md — those
 * still apply. This just forces needs-human when an obvious override attempt is seen,
 * instead of relying on the model to notice it.
 */
const PATTERNS = [
  /abaikan (semua |)instruksi/i,
  /ignore (all |previous |the )?instructions/i,
  /disregard (all |previous |the )?instructions/i,
  /you are now/i,
  /system prompt/i,
  /\bsystem:/i,
  /tampilkan (isi |)(secret|token|api[ _-]?key)/i,
  /print (the |your |)(secret|token|api[ _-]?key)/i,
  /reveal (the |your |)(secret|token|api[ _-]?key)/i,
  /bocorkan/i,
  /jailbreak/i,
];

export function detectInjectionAttempt(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
