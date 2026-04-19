import { reactive } from "vue";

import type { ManagedUser, UserRole, UserStatus } from "./types";

// The backend users API is not in scope for the UI-only handoff, so we keep a
// client-side store that mirrors the shape a real service would expose. Swap
// the mutations for real HTTP calls once the admin API lands.
const initial: ManagedUser[] = [
  {
    id: "usr-001",
    name: "Maya Cortez",
    email: "maya@emeland.io",
    role: "admin",
    status: "active",
    createdAt: "2026-02-10T09:12:00Z",
  },
  {
    id: "usr-002",
    name: "Lutz Berger",
    email: "lutz@emeland.io",
    role: "observer",
    status: "active",
    createdAt: "2026-02-12T10:02:00Z",
  },
  {
    id: "usr-003",
    name: "Sam Okafor",
    email: "sam@emeland.io",
    role: "viewer",
    status: "disabled",
    createdAt: "2026-03-01T14:45:00Z",
  },
];

const state = reactive<{ list: ManagedUser[] }>({ list: [...initial] });

let idSeq = state.list.length;

const nextId = (): string => {
  idSeq += 1;
  return `usr-${String(idSeq).padStart(3, "0")}`;
};

export const useUsers = () => ({
  users: state,
  add: (input: { name: string; email: string; role: UserRole }): ManagedUser => {
    const user: ManagedUser = {
      id: nextId(),
      name: input.name,
      email: input.email,
      role: input.role,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    state.list = [...state.list, user];
    return user;
  },
  update: (id: string, patch: Partial<Pick<ManagedUser, "role" | "status" | "name" | "email">>): void => {
    state.list = state.list.map((user) => (user.id === id ? { ...user, ...patch } : user));
  },
  remove: (id: string): void => {
    state.list = state.list.filter((user) => user.id !== id);
  },
  toggleStatus: (id: string): void => {
    state.list = state.list.map((user) => {
      if (user.id !== id) return user;
      const next: UserStatus = user.status === "active" ? "disabled" : "active";
      return { ...user, status: next };
    });
  },
});

export const resetUsersForTests = (): void => {
  state.list = [...initial];
  idSeq = state.list.length;
};
