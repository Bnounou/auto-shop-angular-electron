const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const legacyFile = () => path.join(app.getPath('userData'), 'autoshop-data.json');
const columns = {
	products: ['id', 'name', 'category', 'barcode', 'purchasePrice', 'salePrice', 'labor', 'quantity', 'minStock', 'supplier', 'reference', 'brand', 'description'],
	sales: ['id', 'transactionId', 'date', 'validatedAt', 'productId', 'productName', 'category', 'quantity', 'unitPrice', 'unitCost', 'labor', 'total', 'discount', 'profit', 'productProfit', 'productStoreShare', 'productOwnerShare', 'productWorkerShare', 'laborStoreShare', 'laborOwnerShare', 'laborWorkerShare', 'soldBy', 'soldByUserId', 'clientName'],
	purchases: ['id', 'date', 'productId', 'productName', 'quantity', 'unitCost', 'total', 'supplier', 'purchasedBy', 'purchasedByUserId'],
	expenses: ['id', 'date', 'amount'],
	cashIns: ['id', 'date', 'amount', 'note'],
	clients: ['id', 'name', 'phone', 'email', 'address'],
	suppliers: ['id', 'name', 'phone', 'email', 'address'],
	users: ['id', 'username', 'displayName', 'passwordHash', 'role', 'createdAt']
};
let db;

function createWindow() {
	const window = new BrowserWindow({
		width: 1440,
		height: 900,
		minWidth: 1100,
		minHeight: 700,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	window.loadFile(path.join(__dirname, '../dist/auto-shop/browser/index.html'));
	
}

function cleanRow(row) {
	return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null));
}

function normalizedRow(table, row) {
	const normalized = {};
	for (const column of columns[table]) {
		normalized[column] = row[column] === undefined ? null : row[column];
	}
	if (table === 'products') {
		normalized.labor ??= 0;
		normalized.quantity ??= 0;
		normalized.minStock ??= 0;
	}
	if (table === 'sales') {
		normalized.transactionId ??= row.id;
		normalized.labor ??= 0;
		normalized.profit ??= 0;
		normalized.productProfit ??= normalized.profit;
		normalized.productStoreShare ??= normalized.productProfit * 0.1;
		normalized.productOwnerShare ??= normalized.productProfit * 0.65;
		normalized.productWorkerShare ??= normalized.productProfit * 0.25;
		normalized.laborStoreShare ??= 0;
		normalized.laborOwnerShare ??= 0;
		normalized.laborWorkerShare ??= 0;
	}
	return normalized;
}

function upsertRow(table, row) {
	const normalized = normalizedRow(table, row);
	const names = columns[table];
	const updates = names.filter(name => name !== 'id').map(name => `${name} = excluded.${name}`).join(', ');
	const statement = db.prepare(`INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')}) ON CONFLICT(id) DO UPDATE SET ${updates}`);
	statement.run(...names.map(name => normalized[name]));
}

function replaceRows(table, rows) {
	const validRows = (Array.isArray(rows) ? rows : []).filter(row => row && typeof row.id === 'string');
	const keep = new Set(validRows.map(row => row.id));
	const existing = db.prepare(`SELECT id FROM ${table}`).all().map(row => row.id);
	const remove = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
	for (const id of existing) if (!keep.has(id)) remove.run(id);
	validRows.forEach(row => upsertRow(table, row));
}

function loadData() {
	const result = {};
	for (const table of ['products', 'sales', 'purchases', 'expenses', 'cashIns', 'clients', 'suppliers']) {
		result[table] = db.prepare(`SELECT * FROM ${table}`).all().map(cleanRow);
	}
	return result;
}

function saveReportState(state) {
	const value = state && typeof state === 'object' ? state : { periodStart: '', archives: [] };
	db.prepare('INSERT INTO report_state (id, periodStart) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET periodStart = excluded.periodStart').run(value.periodStart || '');
	const archives = Array.isArray(value.archives) ? value.archives : [];
	const ids = new Set(archives.filter(item => item && typeof item.id === 'string').map(item => item.id));
	if (ids.size) {
		db.prepare(`DELETE FROM report_archives WHERE id NOT IN (${[...ids].map(() => '?').join(', ')})`).run(...ids);
	} else {
		db.prepare('DELETE FROM report_archives').run();
	}
	const insert = db.prepare(`INSERT INTO report_archives (id, startDate, endDate, revenue, profit, productProfit, laborRevenue, purchaseTotal, itemCount, purchaseCount, storeProductShare, ownerProductShare, workerProductShare, storeLaborShare, ownerLaborShare, workerLaborShare, topProducts) VALUES (@id, @startDate, @endDate, @revenue, @profit, @productProfit, @laborRevenue, @purchaseTotal, @itemCount, @purchaseCount, @storeProductShare, @ownerProductShare, @workerProductShare, @storeLaborShare, @ownerLaborShare, @workerLaborShare, @topProducts) ON CONFLICT(id) DO UPDATE SET startDate=excluded.startDate, endDate=excluded.endDate, revenue=excluded.revenue, profit=excluded.profit, productProfit=excluded.productProfit, laborRevenue=excluded.laborRevenue, purchaseTotal=excluded.purchaseTotal, itemCount=excluded.itemCount, purchaseCount=excluded.purchaseCount, storeProductShare=excluded.storeProductShare, ownerProductShare=excluded.ownerProductShare, workerProductShare=excluded.workerProductShare, storeLaborShare=excluded.storeLaborShare, ownerLaborShare=excluded.ownerLaborShare, workerLaborShare=excluded.workerLaborShare, topProducts=excluded.topProducts`);
	for (const archive of archives) {
		if (!archive || typeof archive.id !== 'string') continue;
		insert.run({
			id: archive.id,
			startDate: archive.startDate || '',
			endDate: archive.endDate || '',
			revenue: archive.revenue || 0,
			profit: archive.profit || 0,
			productProfit: archive.productProfit || 0,
			laborRevenue: archive.laborRevenue || 0,
			purchaseTotal: archive.purchaseTotal || 0,
			itemCount: archive.itemCount || 0,
			purchaseCount: archive.purchaseCount || 0,
			storeProductShare: archive.storeProductShare || 0,
			ownerProductShare: archive.ownerProductShare || 0,
			workerProductShare: archive.workerProductShare || 0,
			storeLaborShare: archive.storeLaborShare || 0,
			ownerLaborShare: archive.ownerLaborShare || 0,
			workerLaborShare: archive.workerLaborShare || 0,
			topProducts: JSON.stringify(archive.topProducts || [])
		});
	}
}

function loadReportState() {
	const state = db.prepare('SELECT periodStart FROM report_state WHERE id = 1').get();
	const archives = db.prepare('SELECT * FROM report_archives ORDER BY startDate DESC').all().map(row => ({
		...cleanRow(row),
		topProducts: JSON.parse(row.topProducts || '[]')
	}));
	return { periodStart: state?.periodStart || '', archives };
}

function parseJson(value, fallback) {
	if (typeof value !== 'string') return value ?? fallback;
	try { return JSON.parse(value); } catch { return fallback; }
}

function mergeById(first, second) {
	const rows = new Map();
	for (const row of [...(Array.isArray(first) ? first : []), ...(Array.isArray(second) ? second : [])]) {
		if (row && typeof row.id === 'string') rows.set(row.id, row);
	}
	return [...rows.values()];
}

function migrateLegacy(storageValues) {
	if (db.prepare("SELECT value FROM app_meta WHERE key = 'legacy_migration_v1'").get()) return false;
	let fileData = {};
	try {
		const parsed = JSON.parse(fs.readFileSync(legacyFile(), 'utf8'));
		fileData = parsed && typeof parsed === 'object' ? parsed : {};
	} catch {}
	const localData = parseJson(storageValues['autoshop-data'], {});
	const businessData = {};
	for (const table of ['products', 'sales', 'purchases', 'expenses', 'cashIns', 'clients', 'suppliers']) {
		businessData[table] = mergeById(fileData[table], localData[table]);
	}
	const legacyUsers = parseJson(storageValues['autoshop-users'], []);
	const reportState = parseJson(storageValues['autoshop-report-periods'], null);
	const transaction = db.transaction(() => {
		for (const table of Object.keys(businessData)) replaceRows(table, businessData[table]);
		if (Array.isArray(legacyUsers) && legacyUsers.length) {
			db.prepare('DELETE FROM users').run();
			legacyUsers.filter(user => user && typeof user.id === 'string').forEach(user => upsertRow('users', user));
		}
		if (reportState && typeof reportState === 'object') saveReportState(reportState);
		db.prepare("INSERT INTO app_meta (key, value) VALUES ('legacy_migration_v1', ?)").run(new Date().toISOString());
	});
	transaction();
	return true;
}

function seedDefaultAdmin() {
	if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count) return;
	upsertRow('users', {
		id: crypto.randomUUID(), username: 'admin', displayName: 'Administrateur',
		passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
		role: 'admin', createdAt: new Date().toISOString()
	});
}

function registerHandlers() {
	ipcMain.handle('data:load', () => loadData());
	ipcMain.handle('data:save', (_event, data) => {
		const transaction = db.transaction(() => {
			for (const table of ['products', 'sales', 'purchases', 'expenses', 'cashIns', 'clients', 'suppliers']) replaceRows(table, data?.[table]);
		});
		transaction();
		return true;
	});
	ipcMain.handle('data:clear', () => {
		const transaction = db.transaction(() => {
			for (const table of ['products', 'sales', 'purchases', 'expenses', 'cashIns', 'clients', 'suppliers', 'users', 'report_archives']) db.prepare(`DELETE FROM ${table}`).run();
			db.prepare('DELETE FROM report_state').run();
			seedDefaultAdmin();
		});
		transaction();
		return true;
	});
	ipcMain.handle('data:migrate', (_event, values) => migrateLegacy(values || {}));

	ipcMain.handle('products:upsert', (_event, product) => { upsertRow('products', product); return true; });
	ipcMain.handle('products:delete', (_event, id) => db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0);
	ipcMain.handle('sales:create', (_event, payload) => {
		const transaction = db.transaction(() => {
			(payload.products || []).forEach(product => upsertRow('products', product));
			(payload.sales || []).forEach(sale => upsertRow('sales', sale));
		});
		transaction();
		return true;
	});
	ipcMain.handle('sales:update', (_event, payload) => {
		const transaction = db.transaction(() => {
			upsertRow('products', payload.product);
			upsertRow('sales', payload.sale);
		});
		transaction();
		return true;
	});
	ipcMain.handle('sales:delete', (_event, payload) => {
		const transaction = db.transaction(() => {
			const ids = Array.isArray(payload.ids) ? payload.ids : payload.id ? [payload.id] : [];
			if (ids.length) db.prepare(`DELETE FROM sales WHERE id IN (${ids.map(() => '?').join(', ')})`).run(...ids);
			const products = Array.isArray(payload.products) ? payload.products : payload.product ? [payload.product] : [];
			products.forEach(product => upsertRow('products', product));
		});
		transaction();
		return true;
	});
	ipcMain.handle('purchases:create', (_event, payload) => {
		const transaction = db.transaction(() => {
			upsertRow('products', payload.product);
			upsertRow('purchases', payload.purchase);
		});
		transaction();
		return true;
	});
	ipcMain.handle('purchases:delete', (_event, payload) => {
		const transaction = db.transaction(() => {
			db.prepare('DELETE FROM purchases WHERE id = ?').run(payload.id);
			if (payload.product) upsertRow('products', payload.product);
		});
		transaction();
		return true;
	});
	ipcMain.handle('clients:upsert', (_event, client) => { upsertRow('clients', client); return true; });
	ipcMain.handle('suppliers:upsert', (_event, supplier) => { upsertRow('suppliers', supplier); return true; });

	ipcMain.handle('users:list', () => db.prepare('SELECT * FROM users ORDER BY username COLLATE NOCASE').all().map(cleanRow));
	ipcMain.handle('users:create', (_event, user) => {
		try { upsertRow('users', user); return true; } catch (error) {
			if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return false;
			throw error;
		}
	});
	ipcMain.handle('users:delete', (_event, id) => {
		const transaction = db.transaction(() => {
			const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
			if (!user) return false;
			if (user.role === 'admin' && db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count <= 1) return false;
			db.prepare('DELETE FROM users WHERE id = ?').run(id);
			return true;
		});
		return transaction();
	});
	ipcMain.handle('users:update', (_event, user) => { upsertRow('users', user); return true; });
	ipcMain.handle('reports:load', () => loadReportState());
	ipcMain.handle('reports:save', (_event, state) => {
		db.transaction(() => saveReportState(state))();
		return true;
	});
}

app.whenReady().then(() => {
	db = require('../database');
	registerHandlers();
	Menu.setApplicationMenu(null);
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
