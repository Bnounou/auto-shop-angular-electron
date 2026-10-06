import { computed, Injectable, signal } from '@angular/core';
import { AppData, CashIn, Client, emptyData, Expense, groupSalesByTransaction, Product, Purchase, Sale, Supplier } from '../models/models';
import { StorageService } from './storage.service';

const localDate = (date = new Date()) => {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

@Injectable({ providedIn: 'root' })
export class DataService {
	data = signal<AppData>(emptyData());
	loaded = signal(false);
	products = computed(() => this.data().products);
	sales = computed(() => this.data().sales);
	transactions = computed(() => groupSalesByTransaction(this.sales()));
	purchases = computed(() => this.data().purchases);
	expenses = computed(() => this.data().expenses ?? []);
	cashIns = computed(() => this.data().cashIns ?? []);
	expenseTotal = computed(() => this.expenses().reduce((sum, expense) => sum + expense.amount, 0));
	cashInTotal = computed(() => this.cashIns().reduce((sum, cashIn) => sum + cashIn.amount, 0));
	lowStock = computed(() => this.products().filter(product => product.quantity <= product.minStock));
	revenue = computed(() => this.sales().reduce((sum, sale) => sum + sale.total, 0));
	profit = computed(() => this.sales().reduce((sum, sale) => sum + sale.profit, 0));
	netProfit = computed(() => this.profit() - this.expenseTotal());
	laborRevenue = computed(() => this.sales().reduce((sum, sale) => sum + (sale.labor ?? 0) * sale.quantity, 0));
	productProfit = computed(() => this.sales().reduce((sum, sale) => sum + (sale.productProfit ?? sale.profit), 0));
	storeProductShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.productProfit ?? sale.profit) * 0.4, 0));
	ownerProductShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.productProfit ?? sale.profit) * 0.5, 0));
	workerProductShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.productProfit ?? sale.profit) * 0.1, 0));
	storeLaborShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.labor ?? 0) * sale.quantity * 0.2, 0));
	storeNetShare = computed(() => this.storeProductShare() + this.storeLaborShare() - this.expenseTotal());
	ownerLaborShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.labor ?? 0) * sale.quantity * 0.4, 0));
	workerLaborShare = computed(() => this.sales().reduce((sum, sale) => sum + (sale.labor ?? 0) * sale.quantity * 0.4, 0));
	stockValue = computed(() => this.products().reduce((sum, product) => sum + product.quantity * product.purchasePrice, 0));

	readonly ready: Promise<void>;

	constructor(private storage: StorageService) {
		this.ready = this.init();
	}

	async init() {
		await this.storage.migrateLegacy();
		const loaded = await this.storage.load(emptyData());
		this.data.set({
			...emptyData(),
			...loaded,
			expenses: loaded.expenses ?? [],
			cashIns: loaded.cashIns ?? []
		});
		this.loaded.set(true);
	}

	private async commit(next: AppData, persist?: () => Promise<unknown>) {
		if (window.api && persist) await persist();
		else await this.storage.save(next);
		this.data.set(next);
	}

	async upsertProduct(product: Product) {
		const current = this.data();
		const products = current.products.some(item => item.id === product.id)
			? current.products.map(item => item.id === product.id ? product : item)
			: [...current.products, product];
		await this.commit({ ...current, products }, () => window.api!.upsertProduct(product));
	}

	async deleteProduct(id: string) {
		const current = this.data();
		await this.commit({ ...current, products: current.products.filter(product => product.id !== id) }, () => window.api!.deleteProduct(id));
	}

	async addExpense(amount: number) {
		if (!Number.isFinite(amount) || amount <= 0) return false;
		const current = this.data();
		const expense: Expense = { id: crypto.randomUUID(), date: localDate(), amount };
		await this.commit({ ...current, expenses: [expense, ...this.expenses()] });
		return true;
	}

	async addCashIn(amount: number, note = '') {
		if (!Number.isFinite(amount) || amount <= 0) return false;
		const current = this.data();
		const cashIn: CashIn = { id: crypto.randomUUID(), date: localDate(), amount, note };
		await this.commit({ ...current, cashIns: [cashIn, ...this.cashIns()] });
		return true;
	}

	async addSale(items: { product: Product; quantity: number; price: number }[], discount = 0, seller?: { id: string; name: string }, laborCharge = 0, clientName = '') {
		const current = this.data();
		let products = [...current.products];
		const sales: Sale[] = [];
		const validatedAt = new Date();
		const date = localDate(validatedAt);
		const validationTimestamp = validatedAt.toISOString();
		const transactionId = crypto.randomUUID();
		const standaloneLabor = Math.max(0, Number(laborCharge) || 0);
		if (!items.length && standaloneLabor > 0) {
			const laborProfit = standaloneLabor;
			const sale: Sale = {
				id: crypto.randomUUID(), transactionId, date, validatedAt: validationTimestamp, productId: '', productName: 'Main-d’œuvre seule', category: 'Main-d’œuvre',
				quantity: 1, unitPrice: 0, unitCost: 0, labor: standaloneLabor,
				total: standaloneLabor, discount: 0, profit: laborProfit, productProfit: 0,
				productStoreShare: 0, productOwnerShare: 0, productWorkerShare: 0,
				laborStoreShare: laborProfit * 0.2, laborOwnerShare: laborProfit * 0.4, laborWorkerShare: laborProfit * 0.4,
				soldBy: seller?.name, soldByUserId: seller?.id, clientName: clientName.trim() || undefined
			};
			await this.commit({ ...current, sales: [sale, ...current.sales] }, () =>
				window.api!.createSales({ sales: [sale], products: [] })
			);
			return;
		}
		const prepared = items.map(item => {
			const product = products.find(entry => entry.id === item.product.id);
			if (!product) return null;
			const quantity = Number(item.quantity);
			if (!Number.isFinite(quantity) || quantity <= 0 || quantity > product.quantity + 1e-9) return null;
			const productGross = quantity * item.price;
			const laborGross = quantity * (product.labor ?? 0);
			return { item, product, quantity, productGross, laborGross, gross: productGross + laborGross };
		}).filter((item): item is NonNullable<typeof item> => item !== null);
		const totalQuantity = prepared.reduce((sum, item) => sum + item.quantity, 0);
		const laborPerUnit = totalQuantity ? Math.max(0, Number(laborCharge) || 0) / totalQuantity : 0;
		for (const item of prepared) {
			item.laborGross += item.quantity * laborPerUnit;
			item.gross += item.quantity * laborPerUnit;
		}
		const productGrossTotal = prepared.reduce((sum, item) => sum + item.productGross, 0);
		const appliedDiscount = Math.max(0, Math.min(Number(discount) || 0, productGrossTotal));

		for (const item of prepared) {
			const lineDiscount = productGrossTotal ? appliedDiscount * item.productGross / productGrossTotal : 0;
			const productProfit = item.productGross - lineDiscount - item.quantity * item.product.purchasePrice;
			const laborTotal = item.laborGross;
			sales.push({
				id: crypto.randomUUID(), transactionId, date, validatedAt: validationTimestamp, productId: item.product.id, productName: item.product.name,
				category: item.product.category, quantity: item.quantity, unitPrice: item.item.price,
				unitCost: item.product.purchasePrice, labor: (item.product.labor ?? 0) + laborPerUnit,
				total: item.gross - lineDiscount, discount: lineDiscount,
				profit: productProfit + laborTotal, productProfit,
				productStoreShare: productProfit * 0.4, productOwnerShare: productProfit * 0.5,
				productWorkerShare: productProfit * 0.1, laborStoreShare: laborTotal * 0.2,
				laborOwnerShare: laborTotal * 0.4, laborWorkerShare: laborTotal * 0.4,
				soldBy: seller?.name, soldByUserId: seller?.id, clientName: clientName.trim() || undefined
			});
			products = products.map(product => product.id === item.product.id
				? { ...product, quantity: Math.max(0, product.quantity - item.quantity) }
				: product);
		}

		const changedProducts = [...new Map(prepared.map(item => [
			item.product.id,
			products.find(product => product.id === item.product.id)!
		])).values()];
		await this.commit(
			{ ...current, products, sales: [...sales, ...current.sales] },
			() => window.api!.createSales({ sales, products: changedProducts })
		);
	}

	async updateSale(id: string, price: number, quantity: number, discount = 0) {
		const current = this.data();
		const sale = current.sales.find(item => item.id === id);
		if (!sale) return false;
		const currentProduct = current.products.find(product => product.id === sale.productId);
		if (!currentProduct) return false;
		const available = currentProduct.quantity + sale.quantity;
		const nextPrice = Number(price);
		const nextQuantity = Number(quantity);
		if (!Number.isFinite(nextPrice) || nextPrice < 0 || !Number.isFinite(nextQuantity) || nextQuantity <= 0 || nextQuantity > available + 1e-9) return false;

		const product = { ...currentProduct, quantity: available - nextQuantity };
		const gross = nextQuantity * (nextPrice + sale.labor);
		const appliedDiscount = Math.max(0, Math.min(Number(discount) || 0, nextQuantity * nextPrice));
		const productDiscount = appliedDiscount;
		const laborTotal = nextQuantity * sale.labor;
		const productProfit = nextQuantity * (nextPrice - sale.unitCost) - productDiscount;
		const updated: Sale = {
			...sale, quantity: nextQuantity, unitPrice: nextPrice, total: gross - appliedDiscount,
			discount: appliedDiscount, profit: productProfit + laborTotal, productProfit,
			productStoreShare: productProfit * 0.4, productOwnerShare: productProfit * 0.5,
			productWorkerShare: productProfit * 0.1, laborStoreShare: laborTotal * 0.2,
			laborOwnerShare: laborTotal * 0.4, laborWorkerShare: laborTotal * 0.4
		};
		await this.commit({
			...current,
			products: current.products.map(item => item.id === product.id ? product : item),
			sales: current.sales.map(item => item.id === id ? updated : item)
		}, () => window.api!.updateSale({ sale: updated, product }));
		return true;
	}

	async deleteSale(id: string) {
		const current = this.data();
		const target = current.sales.find(item => item.id === id || item.transactionId === id);
		if (!target) return;
		const transactionId = target.transactionId || target.id;
		const transactionSales = current.sales.filter(item => (item.transactionId || item.id) === transactionId);
		if (!transactionSales.length) return;
		const returnedQuantities = new Map<string, number>();
		for (const sale of transactionSales) {
			if (sale.productId) returnedQuantities.set(sale.productId, (returnedQuantities.get(sale.productId) || 0) + sale.quantity);
		}
		const products = current.products.map(product => {
			const quantity = returnedQuantities.get(product.id) || 0;
			return quantity ? { ...product, quantity: product.quantity + quantity } : product;
		});
		const changedProducts = products.filter(product => returnedQuantities.has(product.id));
		const saleIds = new Set(transactionSales.map(sale => sale.id));
		await this.commit({
			...current,
			products,
			sales: current.sales.filter(item => !saleIds.has(item.id))
		}, () => window.api!.deleteSale({ids: [...saleIds], products: changedProducts})
		);
	}

	async addPurchase(input: { productId: string; quantity: number; unitCost: number; supplier: string }) {
		const current = this.data();
		const target = current.products.find(product => product.id === input.productId);
		if (!target) return;
		const product = { ...target, quantity: target.quantity + input.quantity, purchasePrice: input.unitCost };
		const purchase: Purchase = {
			id: crypto.randomUUID(), date: localDate(), productId: target.id, productName: target.name,
			quantity: input.quantity, unitCost: input.unitCost, total: input.quantity * input.unitCost,
			supplier: input.supplier || '—'
		};
		await this.commit({
			...current,
			products: current.products.map(item => item.id === product.id ? product : item),
			purchases: [purchase, ...current.purchases]
		}, () => window.api!.createPurchase({ purchase, product }));
	}

	async deletePurchase(id: string) {
		const current = this.data();
		const purchase = current.purchases.find(item => item.id === id);
		if (!purchase) return;
		const target = current.products.find(item => item.id === purchase.productId);
		const updatedProduct = target
			? { ...target, quantity: Math.max(0, target.quantity - purchase.quantity) }
			: undefined;
		const products = updatedProduct
			? current.products.map(item => item.id === updatedProduct.id ? updatedProduct : item)
			: current.products;
		await this.commit({
			...current, products,
			purchases: current.purchases.filter(item => item.id !== id)
		}, () => window.api!.deletePurchase({ id, product: updatedProduct }));
	}

	async upsertClient(client: Client) {
		const current = this.data();
		const clients = current.clients.some(item => item.id === client.id)
			? current.clients.map(item => item.id === client.id ? client : item)
			: [...current.clients, client];
		await this.commit({ ...current, clients }, () => window.api!.upsertClient(client));
	}

	async upsertSupplier(supplier: Supplier) {
		const current = this.data();
		const suppliers = current.suppliers.some(item => item.id === supplier.id)
			? current.suppliers.map(item => item.id === supplier.id ? supplier : item)
			: [...current.suppliers, supplier];
		await this.commit({ ...current, suppliers }, () => window.api!.upsertSupplier(supplier));
	}
}
