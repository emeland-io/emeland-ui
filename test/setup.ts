import "@testing-library/jest-dom/vitest";

import { beforeEach } from "vitest";

// Node 22+ ships an experimental localStorage that can shadow jsdom's. Replace
// it with a fresh in-memory implementation before every test so state doesn't leak.
const installMemoryStorage = () => {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
};

beforeEach(() => {
  installMemoryStorage();
  document.documentElement.removeAttribute("data-theme");
});
