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
        <h2><i class="bi bi-clipboard-data me-2" style="color:var(--primary)"></i>Stock</h2>
        <p>Surveillez les niveaux et les alertes de votre inventaire</p>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-label">Références</div>
              <div class="stat-value">{{db.products().length}}</div>
              <div class="stat-meta">produits distincts</div>
            </div>
            <div class="stat-icon bg-primary-subtle text-primary"><i class="bi bi-box-seam"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-label">Unités en stock</div>
              <div class="stat-value">{{units}}</div>
              <div class="stat-meta">articles disponibles</div>
            </div>
            <div class="stat-icon bg-success-subtle text-success"><i class="bi bi-boxes"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-label">Alertes stock</div>
              <div class="stat-value" [class.negative]="db.lowStock().length">{{db.lowStock().length}}</div>
              <div class="stat-meta">produits à réapprovisionner</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
        </div>
      </div>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar row g-2 mb-3">
      <div class="col-md-7">
        <div style="position:relative">
          <i class="bi bi-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted)"></i>
          <input class="form-control" style="padding-left:32px" [(ngModel)]="q" placeholder="Rechercher par nom ou code-barres...">
        </div>
      </div>
      <div class="col-md-5">
        <select class="form-select" [(ngModel)]="filter">
          <option value="all">Tous les produits</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture de stock</option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="panel">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Produit</th><th>Catégorie</th><th>Stock</th>
              <th>Seuil min.</th><th>État</th><th>Valeur stock</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td>
                <b>{{p.name}}</b>
                <small class="d-block text-muted" style="font-family:monospace;font-size:11px">{{p.reference||p.barcode}}</small>
              </td>
              <td>
                <span class="badge" style="background:var(--surface2);color:var(--text);border:1px solid var(--border);font-weight:500">
                  {{p.category}}
                </span>
              </td>
              <td>
                <strong [class.low-stock]="p.quantity<=p.minStock">{{p.quantity}}</strong>
              </td>
              <td>{{p.minStock}}</td>
              <td>
                <span class="badge"
                  [class.badge-danger]="p.quantity===0"
                  [class.badge-warn]="p.quantity>0&&p.quantity<=p.minStock"
                  [class.badge-success]="p.quantity>p.minStock">
                  {{p.quantity===0?'Rupture':p.quantity<=p.minStock?'Stock faible':'Normal'}}
                </span>
              </td>
              <td><b>{{p.quantity*p.purchasePrice|number:'1.0-0'}} DA</b></td>
            </tr>
            <tr *ngIf="!filtered.length">
              <td colspan="6" class="empty">
                <i class="bi bi-clipboard-x" style="font-size:28px;opacity:.2;display:block;margin-bottom:8px"></i>
                Aucun produit trouvé.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StockComponent {
  q = ''; filter = 'all';
  constructor(public db: DataService) {}
  get units() { return this.db.products().reduce((s, p) => s + p.quantity, 0); }
  get filtered() {
    const q = this.q.toLowerCase();
    return this.db.products().filter(p =>
      (!q || p.name.toLowerCase().includes(q) || p.barcode.includes(q)) &&
      (this.filter === 'all' || (this.filter === 'low' && p.quantity <= p.minStock) || (this.filter === 'out' && p.quantity === 0))
    );
  }
}
