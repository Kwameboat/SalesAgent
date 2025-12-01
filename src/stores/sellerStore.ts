import { create } from 'zustand';
import { Seller } from '@/types';

interface SellerState {
  seller: Seller | null;
  setSeller: (seller: Seller | null) => void;
}

export const useSellerStore = create<SellerState>((set) => ({
  seller: null,
  setSeller: (seller) => set({ seller }),
}));
