import { useEffect, useMemo } from 'react'

/** useMemo for GPU resources: disposes the previous value whenever deps change. */
export function useDisposable(factory, deps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const object = useMemo(factory, deps)
  useEffect(() => () => object.dispose?.(), [object])
  return object
}
