import { AppData, Client, Product, Purchase, Sale, Supplier, User } from './models';

interface ElectronApi {
  loadData: () => Promise<AppData>;
  saveData: (data: AppData) => Promise<boolean>;
  clearData: () => Promise<boolean>;
  migrateLegacy: (values: Record<string, string | null>) => Promise<boolean>;
  upsertProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  createSales: (payload: { sales: Sale[]; products: Product[] }) => Promise<boolean>;
  updateSale: (payload: { sale: Sale; product: Product }) => Promise<boolean>;
  deleteSale: (payload: { id?: string; ids?: string[]; product?: Product; products?: Product[] }) => Promise<boolean>;
  createPurchase: (payload: { purchase: Purchase; product: Product }) => Promise<boolean>;
  deletePurchase: (payload: { id: string; product?: Product }) => Promise<boolean>;
  upsertClient: (client: Client) => Promise<boolean>;
  upsertSupplier: (supplier: Supplier) => Promise<boolean>;
  listUsers: () => Promise<User[]>;
  createUser: (user: User) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUser: (user: User) => Promise<boolean>;
  loadReports: <T>() => Promise<{ periodStart: string; archives: T[] }>;
  saveReports: <T>(state: { periodStart: string; archives: T[] }) => Promise<boolean>;
}

declare global {
  interface Window {
    api?: ElectronApi;
  }
}

export { };

