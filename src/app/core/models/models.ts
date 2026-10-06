export type Category = 'Éclairage' | 'Audio & Multimédia' | 'Confort intérieur' | 'Extérieur & Carrosserie' | 'Entretien & Nettoyage' | 'Pneus & Jantes' | 'Outillage' | 'Sécurité' | 'Autre';
export type UserRole = 'admin' | 'vendeur';

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface Product { id: string; name: string; category: Category; barcode: string; purchasePrice: number; salePrice: number; labor: number; quantity: number; minStock: number; supplier?: string; reference?: string; brand?: string; description?: string }
export interface Sale { id: string; transactionId?: string; date: string; validatedAt?: string; productId: string; productName: string; category: string; quantity: number; unitPrice: number; unitCost: number; labor: number; total: number; discount?: number; profit: number; productProfit: number; productStoreShare: number; productOwnerShare: number; productWorkerShare: number; laborStoreShare: number; laborOwnerShare: number; laborWorkerShare: number; soldBy?: string; soldByUserId?: string; clientName?: string; }
export interface SaleTransaction { id: string; date: string; validatedAt?: string; items: Sale[]; productQuantity: number; total: number; discount: number; profit: number; labor: number; seller?: string; clientName?: string; }
export const groupSalesByTransaction = (sales: Sale[]): SaleTransaction[] => {
  const grouped = new Map<string, Sale[]>();
  for (const sale of sales) {
    const id = sale.transactionId || sale.id;
    const items = grouped.get(id);
    if (items) items.push(sale);
    else grouped.set(id, [sale]);
  }
  return [...grouped.entries()].map(([id, items]) => ({
    id,
    date: items[0].date,
    validatedAt: items[0].validatedAt,
    items,
    productQuantity: items.reduce((total, sale) => total + (sale.productId ? sale.quantity : 0), 0),
    total: items.reduce((total, sale) => total + sale.total, 0),
    discount: items.reduce((total, sale) => total + (sale.discount || 0), 0),
    profit: items.reduce((total, sale) => total + sale.profit, 0),
    labor: items.reduce((total, sale) => total + sale.labor * sale.quantity, 0),
    seller: items.find(sale => sale.soldBy)?.soldBy,
    clientName: items.find(sale => sale.clientName?.trim())?.clientName
  }));
};
export interface Purchase { id: string; date: string; productId: string; productName: string; quantity: number; unitCost: number; total: number; supplier: string; purchasedBy?: string; purchasedByUserId?: string; }
export interface Expense { id: string; date: string; amount: number; }
export interface CashIn { id: string; date: string; amount: number; note?: string; }
export interface Client { id: string; name: string; phone?: string; email?: string; address?: string }
export interface Supplier { id: string; name: string; phone?: string; email?: string; address?: string }
export interface AppData { products: Product[]; sales: Sale[]; purchases: Purchase[]; expenses: Expense[]; cashIns: CashIn[]; clients: Client[]; suppliers: Supplier[]; }

export const emptyData = (): AppData => ({ products: [], sales: [], purchases: [], expenses: [], cashIns: [], clients: [], suppliers: [] });
export const categories: Category[] = ['Éclairage', 'Audio & Multimédia', 'Confort intérieur', 'Extérieur & Carrosserie', 'Entretien & Nettoyage', 'Pneus & Jantes', 'Outillage', 'Sécurité', 'Autre'];
