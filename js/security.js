export async function hashPassword(password, salt) {
  if (!crypto.subtle) throw new Error("Secure password hashing is unavailable. Open this site on localhost or HTTPS.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomSalt() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
