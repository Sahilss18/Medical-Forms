import { create } from 'zustand';
import { Application } from '@/types';

interface ApplicationStore {
  currentApplication: Application | null;
  draftData: Record<string, any>;
  isLoading: boolean;
  setCurrentApplication: (application: Application | null) => void;
  updateDraft: (data: Record<string, any>) => void;
  clearDraft: () => void;
  setLoading: (loading: boolean) => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  currentApplication: null,
  draftData: {},
  isLoading: false,

  setCurrentApplication: (application) => set({ currentApplication: application }),

  updateDraft: (data) =>
    set((state) => ({
      draftData: { ...state.draftData, ...data },
    })),

  clearDraft: () => set({ draftData: {} }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
