/**
 * CORS-safe image prefetch utility for @react-pdf/renderer.
 *
 * Firebase Storage URLs can fail when loaded directly by react-pdf's
 * internal fetch. By converting to base64 data URIs first, we bypass
 * CORS entirely and make PDF generation deterministic.
 */

const cache = new Map<string, string>()

/**
 * Fetches an image URL and returns a base64 data URI.
 * Returns null on any error — never throws.
 */
export async function fetchImageAsBase64(
  url: string,
  timeoutMs = 5000,
): Promise<string | null> {
  if (!url) return null

  const cached = cache.get(url)
  if (cached) return cached

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
    })

    if (!response.ok) return null

    const blob = await response.blob()
    const dataUri = await blobToDataUri(blob)

    if (dataUri) {
      cache.set(url, dataUri)
    }

    return dataUri
  } catch {
    // CORS error, network error, timeout — all return null
    return null
  } finally {
    clearTimeout(timer)
  }
}

function blobToDataUri(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

/**
 * Pre-loads all images needed for the Tx PDF.
 * Uses Promise.allSettled so partial failure is fine.
 */
export async function preloadTxImages(params: {
  signatureUrl?: string
  clinicLogoUrl?: string
}): Promise<{
  signatureBase64: string | null
  clinicLogoBase64: string | null
}> {
  const [sig, logo] = await Promise.allSettled([
    params.signatureUrl
      ? fetchImageAsBase64(params.signatureUrl)
      : Promise.resolve(null),
    params.clinicLogoUrl
      ? fetchImageAsBase64(params.clinicLogoUrl)
      : Promise.resolve(null),
  ])

  return {
    signatureBase64: sig.status === 'fulfilled' ? sig.value : null,
    clinicLogoBase64: logo.status === 'fulfilled' ? logo.value : null,
  }
}
