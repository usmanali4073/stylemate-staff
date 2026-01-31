export function useActiveBusinessId(): string | null {
  // Read from localStorage (set by portal shell BusinessContext)
  return localStorage.getItem('stylemate:active-business-id');
}
