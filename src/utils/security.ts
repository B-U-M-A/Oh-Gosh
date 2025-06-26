// --- Security Utilities --- //

/**
 * Sanitizes text by converting HTML entities to prevent XSS vulnerabilities.
 * Uses DOM text node conversion to safely escape HTML tags and special characters.
 * @param text - The raw text input to be sanitized
 * @returns The sanitized text with HTML entities escaped, or empty string on error
 */
export function sanitizeText(text: string): string {
  try {
    // Create temporary DOM element to leverage browser's HTML escaping
    const element = document.createElement('div')
    // Set text content (automatically escapes HTML)
    element.innerText = text
    // Return innerHTML which now contains escaped entities
    return element.innerHTML
  } catch (error) {
    // Log error and return safe default if sanitization fails
    console.error('Failed to sanitize text, returning empty string.', error)
    return ''
  }
}

/**
 * Validates an asset path to prevent common security vulnerabilities like directory traversal.
 * @param path The asset path to validate.
 * @returns `true` if the path is considered safe for this project, otherwise `false`.
 */
export function isValidAssetPath(path: string): boolean {
  // Rule 1: Disallow directory traversal sequences like '../' or '..\'
  if (path.includes('..')) {
    console.warn(`Security Warning: Asset path contains traversal characters: ${path}`)
    return false
  }

  console.log(`isValidAssetPath check for ${path}:`)
  console.log(`  isAbsolute: ${path.startsWith('/') || /^[a-zA-Z]:\\/.test(path)}`)
  console.log(`  hasProtocol: ${/^[a-zA-Z]+:\/\//.test(path)}`)

  // Rule 2: Disallow absolute paths or external URLs to keep assets project-local.
  // This can be adjusted if loading from a CDN is an intended feature.
  const isAbsolute = path.startsWith('/') || /^[a-zA-Z]:\\/.test(path)
  const hasProtocol = /^[a-zA-Z]+:\/\//.test(path)

  if (isAbsolute || hasProtocol) {
    console.warn(`Security Warning: External or absolute asset paths are not allowed: ${path}`)
    return false
  }

  return true
}
