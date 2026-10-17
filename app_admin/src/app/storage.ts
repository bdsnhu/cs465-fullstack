import { InjectionToken } from '@angular/core';

// Injection token that hands components/services the browser's localStorage.
// Injecting it (instead of touching `localStorage` directly) keeps the code testable.
export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
  providedIn: 'root',
  factory: () => localStorage
});
