import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/models';
import { StorageService } from './storage.service';

const USERS_KEY = 'autoshop-users';
const SESSION_KEY = 'autoshop-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _users = signal<User[]>([]);
  private _currentUser = signal<User | null>(null);
  private readonly readyPromise: Promise<void>;

  currentUser = computed(() => this._currentUser());
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  isLoggedIn = computed(() => this._currentUser() !== null);

  constructor(private storage: StorageService) {
    this.readyPromise = this.init();
  }

  async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  async init() {
    await this.storage.migrateLegacy();
    const users = window.api
      ? await window.api.listUsers()
      : await this.storage.loadKey<User[]>(USERS_KEY, []);

    // Create default admin if no users exist
    if (users.length === 0) {
      const admin: User = {
        id: crypto.randomUUID(),
        username: 'admin',
        displayName: 'Administrateur',
        passwordHash: await this.hash('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      users.push(admin);
      if (window.api) await window.api.createUser(admin);
      else await this.storage.saveKey(USERS_KEY, users);
    }
    this._users.set(users);

    // Restore session
    const savedId = sessionStorage.getItem(SESSION_KEY);
    if (savedId) {
      const user = users.find(u => u.id === savedId);
      if (user) this._currentUser.set(user);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    const h = await this.hash(password);
    const user = this._users().find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === h);
    if (!user) return false;
    this._currentUser.set(user);
    sessionStorage.setItem(SESSION_KEY, user.id);
    return true;
  }

  logout() {
    this._currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  users() { return this._users(); }

  async createUser(username: string, displayName: string, password: string, role: 'admin' | 'vendeur'): Promise<boolean> {
    if (this._users().some(u => u.username.toLowerCase() === username.toLowerCase())) return false;
    const user: User = {
      id: crypto.randomUUID(),
      username,
      displayName,
      passwordHash: await this.hash(password),
      role,
      createdAt: new Date().toISOString(),
    };
    const updated = [...this._users(), user];
    const saved = window.api
      ? await window.api.createUser(user)
      : (await this.storage.saveKey(USERS_KEY, updated), true);
    if (!saved) return false;
    this._users.set(updated);
    return true;
  }

  async deleteUser(id: string) {
    // Cannot delete yourself or last admin
    const remaining = this._users().filter(u => u.id !== id);
    const hasAdmin = remaining.some(u => u.role === 'admin');
    if (!hasAdmin) return false;
    const removed = window.api
      ? await window.api.deleteUser(id)
      : (await this.storage.saveKey(USERS_KEY, remaining), true);
    if (!removed) return false;
    this._users.set(remaining);
    return true;
  }

  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const hash = await this.hash(newPassword);
    const updated = this._users().map(u => u.id === id ? { ...u, passwordHash: hash } : u);
    const user = updated.find(item => item.id === id);
    if (!user) return false;
    if (window.api) await window.api.updateUser(user);
    else await this.storage.saveKey(USERS_KEY, updated);
    this._users.set(updated);
    // Update session if self
    if (this._currentUser()?.id === id) {
      this._currentUser.set(updated.find(u => u.id === id) ?? null);
    }
    return true;
  }

  private async hash(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
