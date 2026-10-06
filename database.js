const crypto = require('crypto');
const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

const db = new Database(path.join(app.getPath('userData'), 'autoshop.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    displayName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'vendeur')),
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    barcode TEXT NOT NULL,
    purchasePrice REAL NOT NULL,
    salePrice REAL NOT NULL,
    labor REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    minStock INTEGER NOT NULL DEFAULT 0,
    supplier TEXT,
    reference TEXT,
    brand TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    transactionId TEXT,
    date TEXT NOT NULL,
    validatedAt TEXT,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    unitCost REAL NOT NULL,
    labor REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    discount REAL,
    profit REAL NOT NULL,
    productProfit REAL NOT NULL,
    productStoreShare REAL NOT NULL,
    productOwnerShare REAL NOT NULL,
    productWorkerShare REAL NOT NULL,
    laborStoreShare REAL NOT NULL,
    laborOwnerShare REAL NOT NULL,
    laborWorkerShare REAL NOT NULL,
    soldBy TEXT,
    soldByUserId TEXT,
    clientName TEXT
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unitCost REAL NOT NULL,
    total REAL NOT NULL,
    supplier TEXT NOT NULL,
    purchasedBy TEXT,
    purchasedByUserId TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cashIns (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS report_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    periodStart TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS report_archives (
    id TEXT PRIMARY KEY,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    revenue REAL NOT NULL,
    profit REAL NOT NULL,
    productProfit REAL NOT NULL,
    laborRevenue REAL NOT NULL,
    purchaseTotal REAL NOT NULL,
    itemCount INTEGER NOT NULL,
    purchaseCount INTEGER NOT NULL,
    storeProductShare REAL NOT NULL,
    ownerProductShare REAL NOT NULL,
    workerProductShare REAL NOT NULL,
    storeLaborShare REAL NOT NULL,
    ownerLaborShare REAL NOT NULL,
    workerLaborShare REAL NOT NULL,
    topProducts TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
  CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
`);

const salesColumns = db.prepare('PRAGMA table_info(sales)').all().map(column => column.name);
if (!salesColumns.includes('transactionId')) db.exec('ALTER TABLE sales ADD COLUMN transactionId TEXT');
if (!salesColumns.includes('validatedAt')) db.exec('ALTER TABLE sales ADD COLUMN validatedAt TEXT');
if (!salesColumns.includes('clientName')) db.exec('ALTER TABLE sales ADD COLUMN clientName TEXT');
db.exec('UPDATE sales SET transactionId = id WHERE transactionId IS NULL OR transactionId = \'\'');
db.exec('CREATE INDEX IF NOT EXISTS idx_sales_transaction ON sales(transactionId)');

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
if (userCount === 0) {
  db.prepare(`
    INSERT INTO users (id, username, displayName, passwordHash, role, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    'admin',
    'Administrateur',
    crypto.createHash('sha256').update('admin123').digest('hex'),
    'admin',
    new Date().toISOString()
  );
}

module.exports = db;
