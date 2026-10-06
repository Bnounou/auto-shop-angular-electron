const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	loadData: () => ipcRenderer.invoke('data:load'),
	saveData: data => ipcRenderer.invoke('data:save', data),
	clearData: () => ipcRenderer.invoke('data:clear'),
	migrateLegacy: values => ipcRenderer.invoke('data:migrate', values),
	upsertProduct: product => ipcRenderer.invoke('products:upsert', product),
	deleteProduct: id => ipcRenderer.invoke('products:delete', id),
	createSales: payload => ipcRenderer.invoke('sales:create', payload),
	updateSale: payload => ipcRenderer.invoke('sales:update', payload),
	deleteSale: payload => ipcRenderer.invoke('sales:delete', payload),
	createPurchase: payload => ipcRenderer.invoke('purchases:create', payload),
	deletePurchase: payload => ipcRenderer.invoke('purchases:delete', payload),
	upsertClient: client => ipcRenderer.invoke('clients:upsert', client),
	upsertSupplier: supplier => ipcRenderer.invoke('suppliers:upsert', supplier),
	listUsers: () => ipcRenderer.invoke('users:list'),
	createUser: user => ipcRenderer.invoke('users:create', user),
	deleteUser: id => ipcRenderer.invoke('users:delete', id),
	updateUser: user => ipcRenderer.invoke('users:update', user),
	loadReports: () => ipcRenderer.invoke('reports:load'),
	saveReports: state => ipcRenderer.invoke('reports:save', state)
});
