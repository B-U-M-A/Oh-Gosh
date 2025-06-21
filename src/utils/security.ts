// --- Security Utilities --- //

export function sanitizeText(text: string): string {
  const element = document.createElement("div");
  element.innerText = text;
  return element.innerHTML;
}

/**
 * Validates an asset path to prevent directory traversal attacks.
 * @param path The asset path to validate.
 * @returns `true` if the path is safe, otherwise `false`.
 */
export function isValidAssetPath(path: string): boolean {
  // Disallow directory traversal sequences like '../' or '..\'
  if (path.includes("..")) {
    console.warn(
      `Security Warning: Asset path contains traversal characters: ${path}`
    );
    return false;
  }
  // Add any other path validation rules here if necessary.
  return true;
}
