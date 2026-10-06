import { Injectable } from '@angular/core';

const LEGACY_KEYS = ['autoshop-data', 'autoshop-users', 'autoshop-report-periods'];

@Injectable({ providedIn: 'root' })
export class StorageService {

  async migrateLegacy(): Promise<void> {
    if (!window.api) return;
    const values = Object.fromEntries(LEGACY_KEYS.map(key => [key, localStorage.getItem(key)]));
    await window.api.migrateLegacy(values);
  }

  async load<T>(fallback: T): Promise<T> {
    try {
      const raw = window.api ? JSON.stringify(await window.api.loadData()) : localStorage.getItem('autoshop-data');
      return raw ? JSON.parse(raw) as T : fallback;
    } catch { return fallback; }
  }

  async save<T>(data: T) {
    if (window.api) await window.api.saveData(data as import('../models/models').AppData);
    else localStorage.setItem('autoshop-data', JSON.stringify(data));
  }

  async loadKey<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch { return fallback; }
  }

  async saveKey<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async clear() {
    if (window.api) await window.api.clearData();
    else {
      localStorage.removeItem('autoshop-data');
      localStorage.removeItem('autoshop-users');
      localStorage.removeItem('autoshop-report-periods');
    }
  }
}
