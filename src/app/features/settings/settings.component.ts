import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-gear me-2" style="color:var(--primary)"></i>Paramètres</h2>
        <p>Configuration et gestion des données de l'application</p>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12" *ngIf="auth.isAdmin()">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h3><i class="bi bi-person-plus me-2" style="color:var(--primary)"></i>Utilisateurs</h3>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Gérez les accès à AUTO SHOP.</div>
            </div>
          </div>
          <div style="padding:20px">
            <form class="row g-3 align-items-end" (ngSubmit)="addUser()" #userForm="ngForm">
              <div class="col-md-3">
                <label class="form-label" for="newUsername">Nom d'utilisateur</label>
                <input id="newUsername" name="newUsername" class="form-control" [(ngModel)]="newUsername" required>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="newDisplayName">Nom affiché</label>
                <input id="newDisplayName" name="newDisplayName" class="form-control" [(ngModel)]="newDisplayName" required>
              </div>
              <div class="col-md-2">
                <label class="form-label" for="newPassword">Mot de passe</label>
                <input id="newPassword" name="newPassword" type="password" class="form-control" [(ngModel)]="newPassword" minlength="4" required>
              </div>
              <div class="col-md-2">
                <label class="form-label" for="newRole">Rôle</label>
                <select id="newRole" name="newRole" class="form-select" [(ngModel)]="newRole">
                  <option value="vendeur">Vendeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary w-100" type="submit" [disabled]="userForm.invalid">
                  <i class="bi bi-person-plus me-1"></i>Ajouter
                </button>
              </div>
            </form>
            <div *ngIf="userMessage" class="alert py-2 mt-3 mb-0" [class.alert-success]="userMessageType === 'success'" [class.alert-danger]="userMessageType === 'danger'">{{userMessage}}</div>

            <div class="table-responsive mt-4">
              <table class="table align-middle mb-0">
                <thead><tr><th>Utilisateur</th><th>Nom affiché</th><th>Rôle</th><th class="text-end">Action</th></tr></thead>
                <tbody>
                  <tr *ngFor="let user of auth.users()">
                    <td><strong>{{user.username}}</strong></td>
                    <td>{{user.displayName}}</td>
                    <td><span class="badge" [class.bg-primary]="user.role === 'admin'" [class.bg-secondary]="user.role !== 'admin'">{{user.role === 'admin' ? 'Administrateur' : 'Vendeur'}}</span></td>
                    <td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" (click)="removeUser(user.id)" [disabled]="user.id === auth.currentUser()?.id"><i class="bi bi-trash3"></i></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- DATA INFO -->
      <div class="col-md-6">
        <div class="panel h-100">
          <div class="panel-head">
            <h3><i class="bi bi-database me-2 text-muted"></i>Stockage SQLite</h3>
          </div>
          <div style="padding:20px">
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:20px">
              <i class="bi bi-info-circle me-1"></i>
              Toutes les données sont sauvegardées localement sur cet ordinateur. Aucune connexion internet n'est requise.
            </p>
            <div class="row g-3">
              <div class="col-4">
                <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
                  <div style="font-size:28px;font-weight:800;color:var(--primary)">{{db.products().length}}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-top:4px"><i class="bi bi-box-seam me-1"></i>Produits</div>
                </div>
              </div>
              <div class="col-4">
                <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
                  <div style="font-size:28px;font-weight:800;color:var(--success)">{{db.transactions().length}}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-top:4px"><i class="bi bi-cart me-1"></i>Ventes</div>
                </div>
              </div>
              <div class="col-4">
                <div style="text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
                  <div style="font-size:28px;font-weight:800;color:var(--warning)">{{db.purchases().length}}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-top:4px"><i class="bi bi-truck me-1"></i>Achats</div>
                </div>
              </div>
            </div>
            <div class="mt-3 d-flex align-items-center gap-2" style="background:var(--success-bg);border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:12px;color:var(--success)">
              <i class="bi bi-shield-check"></i>
              <span>Données stockées localement sur cet appareil</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="col-md-6">
        <div class="panel h-100" style="border-color:#fecaca">
          <div class="panel-head" style="background:#fff5f5">
            <h3 style="color:var(--danger)"><i class="bi bi-exclamation-triangle me-2"></i>Zone de danger</h3>
          </div>
          <div style="padding:20px">
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
              Ces actions sont <strong>irréversibles</strong>. Assurez-vous d'avoir effectué une sauvegarde avant de continuer.
            </p>
            <div style="background:var(--danger-bg);border:1px solid #fecaca;border-radius:10px;padding:16px">
              <div style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:6px">
                <i class="bi bi-trash3 me-1"></i>Effacer toutes les données
              </div>
              <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
                Supprime définitivement tous les produits, ventes, achats, clients et fournisseurs.
              </p>
              <button class="btn btn-danger" (click)="clear()">
                <i class="bi bi-trash3 me-1"></i>Effacer toutes les données
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- APP INFO -->
      <div class="col-12">
        <div class="panel">
          <div class="panel-head">
            <h3><i class="bi bi-info-circle me-2 text-muted"></i>À propos</h3>
          </div>
          <div style="padding:20px;display:flex;align-items:center;gap:20px">
            <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:grid;place-items:center;box-shadow:0 4px 12px rgba(37,99,235,.4)">
              <i class="bi bi-car-front-fill" style="font-size:24px;color:#fff"></i>
            </div>
            <div>
              <div style="font-size:18px;font-weight:800;color:var(--text)">AUTO SHOP</div>
              <div style="font-size:12px;color:var(--text-muted)">Logiciel de gestion de magasin de pièces automobiles</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                <span class="badge" style="background:var(--surface2);color:var(--text-muted);border:1px solid var(--border)">v1.0.0</span>
                <span class="ms-2">Données 100% locales · Aucune connexion requise</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  newUsername = '';
  newDisplayName = '';
  newPassword = '';
  newRole: 'admin' | 'vendeur' = 'vendeur';
  userMessage = '';
  userMessageType: 'success' | 'danger' = 'success';

  constructor(public db: DataService, private storage: StorageService, public auth: AuthService) {}

  async addUser() {
    const created = await this.auth.createUser(this.newUsername.trim(), this.newDisplayName.trim(), this.newPassword, this.newRole);
    this.userMessageType = created ? 'success' : 'danger';
    this.userMessage = created ? 'Utilisateur ajouté avec succès.' : 'Ce nom d’utilisateur existe déjà.';
    if (created) {
      this.newUsername = '';
      this.newDisplayName = '';
      this.newPassword = '';
      this.newRole = 'vendeur';
    }
  }

  async removeUser(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const removed = await this.auth.deleteUser(id);
    this.userMessageType = removed ? 'success' : 'danger';
    this.userMessage = removed ? 'Utilisateur supprimé.' : 'Impossible de supprimer le dernier administrateur.';
  }

  async clear() {
    if (confirm('Cette action supprimera TOUTES les données. Cette opération est irréversible. Continuer ?')) {
      await this.storage.clear(); location.reload();
    }
  }
}
