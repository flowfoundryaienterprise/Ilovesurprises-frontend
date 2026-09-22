/**
 * In-memory session tracker for page loading states.
 * 
 * Behavior:
 * - On First Open / Browser Refresh (F5 / Reload): Memory starts empty, so skeleton loading shimmer runs.
 * - On Subsequent Navigation within the same session (e.g. Home -> Shop -> Home):
 *   Already-loaded pages return isFirstVisit = false and render immediately with NO loader/skeleton delay.
 */
const visitedPages = new Set<string>();

export const sessionTracker = {
  /**
   * Returns true ONLY if this page is being loaded for the first time in the current session.
   * Automatically marks the page as visited.
   */
  isFirstVisit(pageKey: string): boolean {
    if (visitedPages.has(pageKey)) {
      return false;
    }
    visitedPages.add(pageKey);
    return true;
  },

  /**
   * Check if a page has already been loaded
   */
  hasVisited(pageKey: string): boolean {
    return visitedPages.has(pageKey);
  },

  /**
   * Explicitly mark a page as loaded
   */
  markVisited(pageKey: string): void {
    visitedPages.add(pageKey);
  },

  /**
   * Reset session tracking (for testing or full reset)
   */
  reset(): void {
    visitedPages.clear();
  },
};

export default sessionTracker;
