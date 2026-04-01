'use client'

import { useCallback, useState } from 'react'

interface UseModalReturn<T = undefined> {
  isOpen: boolean
  data: T | undefined
  open: (data?: T) => void
  close: () => void
  toggle: () => void
}

export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | undefined>(undefined)

  const open = useCallback((payload?: T) => {
    setData(payload)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(undefined)
  }, [])

  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  return { isOpen, data, open, close, toggle }
}
