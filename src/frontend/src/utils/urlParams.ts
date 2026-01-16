/**
 * Utility functions for parsing and managing URL parameters
 * Works with both hash-based and browser-based routing
 */

/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 *
 * @param paramName - The name of the parameter to extract
 * @returns The parameter value if found, null otherwise
 */
export function getUrlParameter(paramName: string): string | null {
    // Try to get from regular query string first
    const urlParams = new URLSearchParams(window.location.search);
    const regularParam = urlParams.get(paramName);

    if (regularParam !== null) {
        return regularParam;
    }

    // If not found, try to extract from hash (for hash-based routing)
    const hash = window.location.hash;
    const queryStartIndex = hash.indexOf('?');

    if (queryStartIndex !== -1) {
        const hashQuery = hash.substring(queryStartIndex + 1);
        const hashParams = new URLSearchParams(hashQuery);
        return hashParams.get(paramName);
    }

    return null;
}

/**
 * Stores a parameter in sessionStorage for persistence across navigation
 * Useful for maintaining state like admin tokens throughout the session
 *
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export function storeSessionParameter(key: string, value: string): void {
    try {
        sessionStorage.setItem(key, value);
    } catch (error) {
        console.warn(`Failed to store session parameter ${key}:`, error);
    }
}

/**
 * Retrieves a parameter from sessionStorage
 *
 * @param key - The key to retrieve
 * @returns The stored value if found, null otherwise
 */
export function getSessionParameter(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch (error) {
        console.warn(`Failed to retrieve session parameter ${key}:`, error);
        return null;
    }
}

/**
 * Gets a parameter from URL or sessionStorage (URL takes precedence)
 * If found in URL, also stores it in sessionStorage for future use
 *
 * @param paramName - The name of the parameter to retrieve
 * @param storageKey - Optional custom storage key (defaults to paramName)
 * @returns The parameter value if found, null otherwise
 */
export function getPersistedUrlParameter(paramName: string, storageKey?: string): string | null {
    const key = storageKey || paramName;

    // Check URL first
    const urlValue = getUrlParameter(paramName);
    if (urlValue !== null) {
        // Store in session for persistence
        storeSessionParameter(key, urlValue);
        return urlValue;
    }

    // Fall back to session storage
    return getSessionParameter(key);
}

/**
 * Removes a parameter from sessionStorage
 *
 * @param key - The key to remove
 */
export function clearSessionParameter(key: string): void {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.warn(`Failed to clear session parameter ${key}:`, error);
    }
}

/**
 * Removes a specific parameter from the URL hash without reloading the page
 * Preserves route information and other parameters in the hash
 * Used to remove sensitive data from the address bar after extracting it
 *
 * @param paramName - The parameter to remove from the hash
 *
 * @example
 * // URL: https://app.com/#/dashboard?caffeineAdminToken=xxx&other=value
 * // After clearParamFromHash('caffeineAdminToken')
 * // URL: https://app.com/#/dashboard?other=value
 */
function clearParamFromHash(paramName: string): void {
    if (!window.history.replaceState) {
        return;
    }

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) {
        return;
    }

    // Remove the leading #
    const hashContent = hash.substring(1);

    // Split route path from query string
    const queryStartIndex = hashContent.indexOf('?');

    if (queryStartIndex === -1) {
        // No query string in hash, nothing to remove
        return;
    }

    const routePath = hashContent.substring(0, queryStartIndex);
    const queryString = hashContent.substring(queryStartIndex + 1);

    // Parse and remove the specific parameter
    const params = new URLSearchParams(queryString);
    params.delete(paramName);

    // Reconstruct the URL
    const newQueryString = params.toString();
    let newHash = routePath;

    if (newQueryString) {
        newHash += '?' + newQueryString;
    }

    // If we still have content in the hash, keep it; otherwise remove the hash entirely
    const newUrl = window.location.pathname + window.location.search + (newHash ? '#' + newHash : '');
    window.history.replaceState(null, '', newUrl);
}

/**
 * Gets a secret from the URL hash fragment only (more secure than query params)
 * Hash fragments aren't sent to servers or logged in access logs
 * The hash is immediately cleared from the URL after extraction to prevent history leakage
 *
 * Usage: https://yourapp.com/#secret=xxx
 *
 * @param paramName - The name of the secret parameter
 * @returns The secret value if found (from hash or session), null otherwise
 */
export function getSecretFromHash(paramName: string): string | null {
    // Check session first to avoid unnecessary URL manipulation
    const existingSecret = getSessionParameter(paramName);
    if (existingSecret !== null) {
        return existingSecret;
    }

    // Try to extract from hash
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) {
        return null;
    }

    // Remove the leading #
    const hashContent = hash.substring(1);
    const params = new URLSearchParams(hashContent);
    const secret = params.get(paramName);

    if (secret) {
        // Store in session for persistence
        storeSessionParameter(paramName, secret);
        // Immediately clear the secret parameter from URL to avoid history leakage
        clearParamFromHash(paramName);
        return secret;
    }

    return null;
}

/**
 * Gets a secret parameter with fallback chain: hash -> sessionStorage
 * This is the recommended way to handle sensitive parameters like admin tokens
 *
 * Security benefits over regular URL params:
 * - Hash fragments are not sent to the server
 * - Not logged in server access logs
 * - Not sent in HTTP Referer headers
 * - Automatically cleared from URL after extraction
 *
 * @param paramName - The name of the secret parameter
 * @returns The secret value if found, null otherwise
 */
export function getSecretParameter(paramName: string): string | null {
    return getSecretFromHash(paramName);
}
