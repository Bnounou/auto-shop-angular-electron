import { Injectable, signal } from '@angular/core';
import { DataService } from './data.service';
import { StorageService } from './storage.service';

export interface ProductSummary { name: string; qty: number; revenue: number }
export interface ReportSnapshot {
	id: string;
	startDate: string;
	endDate: string;
	revenue: number;
	grossProfit: number;
	profit: number;
	productProfit: number;
	laborRevenue: number;
	purchaseTotal: number;
	expenseTotal: number;
	cashInTotal: number;
	cashFlow: number;
	itemCount: number;
	purchaseCount: number;
	storeProductShare: number;
	ownerProductShare: number;
	workerProductShare: number;
	storeLaborShare: number;
	ownerLaborShare: number;
	workerLaborShare: number;
	topProducts: ProductSummary[];
}

interface PersistedReportState {
	periodStart: string;
	archives: ReportSnapshot[];
}

const REPORT_STATE_KEY = 'autoshop-report-periods';
const isDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const localDate = () => {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const addDays = (date: string, days: number) => {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};
const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
const addMonths = (date: string, months: number) => {
	const [year, month] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
};

@Injectable({providedIn: 'root'})
export class ReportService {
	readonly archives = signal<ReportSnapshot[]>([]);
	private periodStart = '';

	constructor(private db: DataService, private storage: StorageService) {}

	async initialize() {
		await this.db.ready;
		const today = localDate();
		const saved = window.api
			? await window.api.loadReports<ReportSnapshot>()
			: await this.storage.loadKey<PersistedReportState>(REPORT_STATE_KEY, {periodStart: '', archives: []});
		const archives = Array.isArray(saved.archives) ? saved.archives.filter(item => isDate(item.startDate) && isDate(item.endDate)) : [];
		const dates = [...this.db.sales(), ...this.db.purchases(), ...this.db.expenses(), ...this.db.cashIns()]
			.map(transaction => transaction.date)
			.filter(isDate)
		const firstSavedDate = [...dates, ...archives.map(archive => archive.startDate)].sort()[0] || today;
		let start = monthStart(firstSavedDate);
		const currentMonth = monthStart(today);
		while (start < currentMonth) {
			const archiveId = `month:${start.slice(0, 7)}`;
			const snapshot = this.buildSnapshot(start, addMonths(start, 1), archiveId);
			const existingIndex = archives.findIndex(archive => archive.id === archiveId);
			if (existingIndex < 0) archives.push(snapshot);
			else archives[existingIndex] = snapshot;
			start = addMonths(start, 1);
		}

		this.periodStart = currentMonth;
		archives.sort((a, b) => b.startDate.localeCompare(a.startDate));
		this.archives.set(archives);
		const state = {periodStart: currentMonth, archives};
		if (window.api) await window.api.saveReports(state);
		else await this.storage.saveKey(REPORT_STATE_KEY, state);
	}

	get currentPeriod() {
		const start = this.periodStart || localDate();
		const month = monthStart(start);
		return this.buildSnapshot(month, addMonths(month, 1), 'current-month', localDate());
	}

	get today() {
		const start = localDate();
		return this.buildSnapshot(start, addDays(start, 1), 'today', start);
	}

	forDate(date: string) {
		return this.buildSnapshot(date, addDays(date, 1), `day:${date}`, date);
	}

	private buildSnapshot(startDate: string, endExclusive: string, id = startDate, displayEndDate = addDays(endExclusive, -1)): ReportSnapshot {
		const sales = this.db.sales().filter(sale => sale.date >= startDate && sale.date < endExclusive);
		const purchases = this.db.purchases().filter(purchase => purchase.date >= startDate && purchase.date < endExclusive);
		const expenses = this.db.expenses().filter(expense => expense.date >= startDate && expense.date < endExclusive);
		const cashIns = this.db.cashIns().filter(cashIn => cashIn.date >= startDate && cashIn.date < endExclusive);
		const topProducts = new Map<string, ProductSummary>();
		const revenue = sales.reduce((total, sale) => total + sale.total, 0);
		const grossProfit = sales.reduce((total, sale) => total + sale.profit, 0);
		const purchaseTotal = purchases.reduce((total, purchase) => total + purchase.total, 0);
		const expenseTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
		const cashInTotal = cashIns.reduce((total, cashIn) => total + cashIn.amount, 0);
		let productProfit = 0;
		let laborRevenue = 0;
		let storeProductShare = 0;
		let ownerProductShare = 0;
		let workerProductShare = 0;
		let storeLaborShare = 0;
		let ownerLaborShare = 0;
		let workerLaborShare = 0;

		for (const sale of sales) {
			const itemProfit = sale.productProfit ?? sale.profit;
			const labor = (sale.labor ?? 0) * sale.quantity;
			productProfit += itemProfit;
			laborRevenue += labor;
			storeProductShare += itemProfit * 0.4;
			ownerProductShare += itemProfit * 0.5;
			workerProductShare += itemProfit * 0.1;
			storeLaborShare += labor * 0.2;
			ownerLaborShare += labor * 0.4;
			workerLaborShare += labor * 0.4;

			if (sale.productId) {
				const summary = topProducts.get(sale.productId) || {name: sale.productName, qty: 0, revenue: 0};
				summary.qty += sale.quantity;
				summary.revenue += sale.total;
				topProducts.set(sale.productId, summary);
			}
		}

		return {
			id,
			startDate,
			endDate: displayEndDate,
			revenue,
			grossProfit,
			profit: grossProfit - expenseTotal,
			productProfit,
			laborRevenue,
			purchaseTotal,
			expenseTotal,
			cashInTotal,
			cashFlow: revenue + cashInTotal - purchaseTotal - expenseTotal,
			itemCount: sales.reduce((total, sale) => total + (sale.productId ? sale.quantity : 0), 0),
			purchaseCount: purchases.length,
			storeProductShare,
			ownerProductShare,
			workerProductShare,
			storeLaborShare,
			ownerLaborShare,
			workerLaborShare,
			topProducts: [...topProducts.values()].sort((a, b) => b.qty - a.qty).slice(0, 10)
		};
	}
}
