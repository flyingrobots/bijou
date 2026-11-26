import { useCallback } from 'react';
import { MountHost } from '../chrome/mount-host.js';
import { bootDogfood } from './boot.js';

/** DOGFOOD with nothing around it: the Surface is the whole window. */
export function DogfoodPage() {
  const onHost = useCallback((host: HTMLElement) => { bootDogfood(host); }, []);
  return <MountHost id="surface" size="window" label="DOGFOOD" onHost={onHost} />;
}
