async function sha256WithSubtle(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256Hex(value: string): Promise<string> {
  const normalized = String(value ?? '')

  if (globalThis.crypto?.subtle) {
    return sha256WithSubtle(normalized)
  }

  throw new Error('webcrypto_unavailable')
}

export async function sha256SecretRef(value: string): Promise<string> {
  const hash = await sha256Hex(value)
  return `sha256:${hash}`
}
