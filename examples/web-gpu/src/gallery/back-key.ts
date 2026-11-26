import { useEffect } from 'react';
import { focusInChrome } from '../chrome/keys.js';

/**
 * `Esc` runs `onBack` while focus is in the chrome. While focus is inside the
 * demo's Surface every key belongs to the demo, so the key does nothing there.
 */
export function useBackKey(onBack: () => void): void {
  useEffect(() => {
    const listener = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || !focusInChrome()) return;
      event.preventDefault();
      onBack();
    };
    window.addEventListener('keydown', listener);
    return () => { window.removeEventListener('keydown', listener); };
  }, [onBack]);
}
