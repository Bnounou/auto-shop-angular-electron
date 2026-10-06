import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../core/services/data.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-truck me-2" style="color:var(--primary)"></i>Achats</h2>
        <p>Réceptions et réapprovisionnement du stock</p>
      </div>
    </div>

    <!-- PURCHASE FORM -->
    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-plus-circle me-2 text-muted"></i>Enregistrer un achat</h3>
      </div>
      <div style="padding:20px">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Produit *</label>
            <select class="form-select" [(ngModel)]="productId">
              <option value="">Sélectionner un produit...</option>
              <option *ngFor="let p of db.products()" [value]="p.id">{{p.name}}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Fournisseur</label>
            <input class="form-control" [(ngModel)]="supplier" placeholder="Nom du fournisseur">
          </div>
          <div class="col-md-2">
            <label class="form-label">Quantité</label>
            <input class="form-control" type="number" min="1" [(ngModel)]="quantity">
          </div>
          <div class="col-md-3">
            <label class="form-label">Prix unitaire achat (DA)</label>
            <input class="form-control" type="number" min="0" [(ngModel)]="unitCost">
          </div>
        </div>
        <div class="d-flex align-items-center gap-3 mt-3">
          <button class="btn btn-primary" [disabled]="!productId" (click)="save()">
            <i class="bi bi-check2-circle me-1"></i>Enregistrer l'achat
          </button>
          <span *ngIf="productId && quantity && unitCost" style="font-size:13px;color:var(--text-muted)">
            Total estimé : <b style="color:var(--primary)">{{(quantity*unitCost)|number:'1.0-0'}} DA</b>
          </span>
        </div>
      </div>
    </div>

    <!-- HISTORY -->
    <div class="panel">
      <div class="panel-head">
        <h3><i class="bi bi-clock-history me-2 text-muted"></i>Historique des achats</h3>
        <span class="text-muted small">{{db.purchases().length}} achat(s)</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Date</th><th>Produit</th><th>Fournisseur</th>
              <th>Qté</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of db.purchases()">
              <td><span style="font-family:monospace;font-size:12px">{{p.date}}</span></td>
              <td><b>{{p.productName}}</b></td>
              <td>{{p.supplier||'—'}}</td>
              <td><span class="badge" style="background:var(--surface2);color:var(--text);border:1px solid var(--border)">{{p.quantity}}</span></td>
              <td><b>{{p.total|number:'1.0-0'}} DA</b></td>
              <td>
                <button class="btn btn-sm btn-outline-danger" (click)="cancel(p.id)" title="Annuler">
                  <i class="bi bi-x-lg"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="!db.purchases().length">
              <td colspan="6" class="empty">
                <i class="bi bi-truck" style="font-size:28px;opacity:.2;display:block;margin-bottom:8px"></i>
                Aucun achat enregistré.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PurchasesComponent {
  productId = ''; supplier = ''; quantity = 1; unitCost = 0;
  constructor(public db: DataService) {}
  async save() {
    await this.db.addPurchase({productId: this.productId, quantity: +this.quantity, unitCost: +this.unitCost, supplier: this.supplier});
    this.productId = ''; this.supplier = ''; this.quantity = 1; this.unitCost = 0;
  }
  async cancel(id: string) { if (confirm('Annuler cet achat ?')) await this.db.deletePurchase(id); }
}
