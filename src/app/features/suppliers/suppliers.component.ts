import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../core/services/data.service';
import {Supplier} from '../../core/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-building me-2" style="color:var(--primary)"></i>Fournisseurs</h2>
        <p>Gestion des partenaires d'approvisionnement</p>
      </div>
      <button class="btn btn-primary" (click)="new()">
        <i class="bi bi-plus-lg me-1"></i>Nouveau fournisseur
      </button>
    </div>

    <div class="panel">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th><i class="bi bi-building me-1"></i>Fournisseur</th>
              <th><i class="bi bi-telephone me-1"></i>Téléphone</th>
              <th><i class="bi bi-envelope me-1"></i>Email</th>
              <th><i class="bi bi-geo-alt me-1"></i>Adresse</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of db.data().suppliers">
              <td><b>{{s.name}}</b></td>
              <td>{{s.phone||'—'}}</td>
              <td>{{s.email||'—'}}</td>
              <td>{{s.address||'—'}}</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="edit(s)" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(s.id)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="!db.data().suppliers.length">
              <td colspan="5" class="empty">
                <i class="bi bi-building" style="font-size:28px;opacity:.2;display:block;margin-bottom:8px"></i>
                Aucun fournisseur enregistré.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal-backdrop" *ngIf="show">
      <div class="modal">
        <div class="modal-head">
          <h3>Fournisseur</h3>
          <button (click)="show=false"><i class="bi bi-x-lg" style="font-size:12px"></i></button>
        </div>
        <div style="padding:20px">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Nom du fournisseur *</label>
              <input class="form-control" [(ngModel)]="form.name" placeholder="Ex: Auto Parts DZ">
            </div>
            <div class="col-md-6">
              <label class="form-label">Téléphone</label>
              <input class="form-control" [(ngModel)]="form.phone" placeholder="0555 123 456">
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input class="form-control" [(ngModel)]="form.email" placeholder="contact@exemple.com">
            </div>
            <div class="col-12">
              <label class="form-label">Adresse</label>
              <input class="form-control" [(ngModel)]="form.address" placeholder="Rue, Ville">
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" (click)="show=false">Annuler</button>
          <button class="btn btn-primary" (click)="save()"><i class="bi bi-check2 me-1"></i>Enregistrer</button>
        </div>
      </div>
    </div>
  `
})
export class SuppliersComponent {
  show = false; form: Supplier = this.blank();
  constructor(public db: DataService) {}
  blank(): Supplier { return {id: crypto.randomUUID(), name: ''}; }
  new() { this.form = this.blank(); this.show = true; }
  edit(s: Supplier) { this.form = {...s}; this.show = true; }
  async save() { if (this.form.name.trim()) await this.db.upsertSupplier(this.form); this.show = false; }
  async remove(id: string) { const a = this.db.data(); await this.db['commit']({...a, suppliers: a.suppliers.filter(s => s.id !== id)} as any); }
}
