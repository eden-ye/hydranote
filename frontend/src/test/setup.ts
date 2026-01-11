import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver for BlockSuite components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock indexedDB for y-indexeddb
const indexedDB = {
  open: () => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          get: () => ({ onsuccess: null, onerror: null }),
          put: () => ({ onsuccess: null, onerror: null }),
        }),
      }),
      close: () => {},
    },
  }),
  deleteDatabase: () => ({ onsuccess: null, onerror: null }),
}
Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB })

// Mock import.meta.env for supabase
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
