import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VendorStore {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  branch: string;
  commission: number;
  status: 'active' | 'inactive';
}

interface StoreOwner {
  id: string;
  name: string;
  stores: VendorStore[];
}

interface VendorState {
  selectedStoreId: string | 'all' | null;
  selectedOwnerId: string | 'all' | null;
  stores: VendorStore[];
  owners: StoreOwner[];
  setSelectedStore: (storeId: string | 'all') => void;
  setSelectedOwner: (ownerId: string | 'all') => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      selectedOwnerId: null,
      stores: [
        {
          id: '1',
          ownerId: 'owner1',
          ownerName: 'أحمد محمد',
          name: 'سوبرماركت السعادة',
          branch: 'الفرع الرئيسي',
          commission: 10,
          status: 'active'
        },
        {
          id: '2',
          ownerId: 'owner1',
          ownerName: 'أحمد محمد',
          name: 'سوبرماركت السعادة',
          branch: 'فرع صلالة',
          commission: 10,
          status: 'active'
        },
        {
          id: '3',
          ownerId: 'owner2',
          ownerName: 'فاطمة علي',
          name: 'متجر البركة',
          branch: 'الفرع الرئيسي',
          commission: 12,
          status: 'active'
        }
      ],
      owners: [
        {
          id: 'owner1',
          name: 'أحمد محمد',
          stores: []
        },
        {
          id: 'owner2',
          name: 'فاطمة علي',
          stores: []
        }
      ],
      setSelectedStore: (storeId) => set({ selectedStoreId: storeId }),
      setSelectedOwner: (ownerId) => set({ selectedOwnerId: ownerId })
    }),
    {
      name: 'vendor-storage'
    }
  )
);