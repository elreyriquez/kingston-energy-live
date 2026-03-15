import { create } from 'zustand';

interface UiState {
  isChatOpen: boolean;
  isAlertsOpen: boolean;
  toggleChat: () => void;
  toggleAlerts: () => void;
  closeChat: () => void;
  closeAlerts: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isChatOpen: false,
  isAlertsOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen, isAlertsOpen: false })),
  toggleAlerts: () => set((state) => ({ isAlertsOpen: !state.isAlertsOpen, isChatOpen: false })),
  closeChat: () => set({ isChatOpen: false }),
  closeAlerts: () => set({ isAlertsOpen: false }),
}));
