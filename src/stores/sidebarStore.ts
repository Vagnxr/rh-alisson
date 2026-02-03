import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean; // Mobile menu state
  isPinned: boolean; // Desktop: mantém sidebar expandida
  openSubmenus: string[]; // Submenus abertos (persistidos)
  toggle: () => void;
  open: () => void;
  close: () => void;
  togglePin: () => void;
  toggleSubmenu: (label: string) => void;
  setSubmenuOpen: (label: string, open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isPinned: false,
      openSubmenus: [],
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      toggleSubmenu: (label: string) =>
        set((state) => ({
          openSubmenus: state.openSubmenus.includes(label)
            ? state.openSubmenus.filter((l) => l !== label)
            : [...state.openSubmenus, label],
        })),
      setSubmenuOpen: (label: string, open: boolean) =>
        set((state) => ({
          openSubmenus: open
            ? state.openSubmenus.includes(label)
              ? state.openSubmenus
              : [...state.openSubmenus, label]
            : state.openSubmenus.filter((l) => l !== label),
        })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isPinned: state.isPinned, openSubmenus: state.openSubmenus }),
    }
  )
);
