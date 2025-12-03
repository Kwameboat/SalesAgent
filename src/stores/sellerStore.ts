import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface SellerState {
  products: Product[];
  selectedProduct: Product | null;
  isChatOpen: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  setProducts: (products: Product[]) => void;
  selectProduct: (product: Product | null) => void;
  toggleChat: () => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  clearMessages: () => void;
}

export const useSellerStore = create<SellerState>((set) => ({
  products: [],
  selectedProduct: null,
  isChatOpen: false,
  messages: [],
  
  setProducts: (products) => set({ products }),
  selectProduct: (product) => set({ selectedProduct: product }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  clearMessages: () => set({ messages: [] }),
}));
