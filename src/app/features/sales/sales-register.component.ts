import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-journal-text me-2" style="color:var(--primary)"></i>Registre des ventes</h2>
        <p>Consultation détaillée des transactions enregistrées</p>
      </div>
      <button class="btn btn-outline-secondary" type="button" (click)="clearFilters()" [disabled]="!hasFilters">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Réinitialiser
      </button>
    </div>

    <section class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-funnel me-2 text-muted"></i>Filtres</h3>
        <span class="text-muted small">{{filteredTransactions.length}} vente(s) affichée(s) sur {{db.transactions().length}}</span>
      </div>
      <div class="row g-3 p-3 align-items-end">
        <div class="col-md-6">
          <label class="form-label" for="registerMonth">Mois</label>
          <select id="registerMonth" class="form-select" [(ngModel)]="selectedMonth" (ngModelChange)="onMonthChange($event)">
            <option value="">Tous les mois</option>
            <option *ngFor="let month of availableMonths" [value]="month.value">{{month.label}}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="registerDate">Date précise</label>
          <input id="registerDate" class="form-control" type="date" [(ngModel)]="selectedDate" (ngModelChange)="onDateChange($event)">
        </div>
      </div>
    </section>

    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Ventes filtrées</div>
          <div class="stat-value">{{filteredTransactions.length|number:'1.0-0'}}</div>
          <div class="stat-meta">{{itemsSold|number:'1.0-0'}} article(s)</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Total encaissé</div>
          <div class="stat-value">{{totalRevenue|number:'1.0-0'}} DA</div>
          <div class="stat-meta">après remises</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Bénéfice total</div>
          <div class="stat-value positive">{{totalProfit|number:'1.0-0'}} DA</div>
          <div class="stat-meta">produits et main-d’œuvre</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Main-d’œuvre facturée</div>
          <div class="stat-value">{{totalLabor|number:'1.0-0'}} DA</div>
          <div class="stat-meta">sur la sélection</div>
        </div>
      </div>
    </div>

    <section class="panel">
      <div class="panel-head">
        <h3><i class="bi bi-receipt me-2 text-muted"></i>Détail des ventes</h3>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Date / heure de validation</th><th>Articles vendus</th><th>Client</th><th>Remise</th>
              <th>Total payé</th><th>Bénéfice</th><th>Vendeur</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let sale of filteredTransactions">
              <td>
                <span style="font-family:monospace;font-size:12px">{{sale.date}}</span>
                <small class="d-block text-muted">{{sale.validatedAt ? (sale.validatedAt|date:'HH:mm:ss') : '—'}}</small>
              </td>
              <td>
                <div *ngFor="let item of sale.items" class="d-flex justify-content-between align-items-start gap-3 py-1">
                  <div>
                    <b>{{item.productName}}</b>
                    <small *ngIf="item.productId" class="text-muted d-block">Quantité : {{item.quantity}}</small>
                    <small *ngIf="!item.productId" class="text-muted d-block">Main-d’œuvre seule</small>
                    <small *ngIf="item.labor > 0" class="text-muted d-block">Main-d’œuvre : {{(item.labor * item.quantity)|number:'1.0-0'}} DA</small>
                  </div>
                  <b class="text-nowrap">{{item.total|number:'1.0-0'}} DA</b>
                </div>
              </td>
              <td>{{sale.clientName || '—'}}</td>
              <td>{{sale.discount|number:'1.0-0'}} DA</td>
              <td><b>{{sale.total|number:'1.0-0'}} DA</b></td>
              <td class="positive"><b>{{sale.profit|number:'1.0-0'}} DA</b></td>
              <td>{{sale.seller||'—'}}</td>
              <td>
                <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteSale(sale.id)" [attr.aria-label]="'Supprimer la vente du ' + sale.date" title="Supprimer la vente">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="!filteredTransactions.length">
              <td colspan="8" class="empty">
                <i class="bi bi-receipt" style="font-size:28px;opacity:.2;display:block;margin-bottom:8px"></i>
                {{db.transactions().length ? 'Aucune vente pour cette période.' : 'Aucune vente enregistrée.'}}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class SalesRegisterComponent {
  selectedMonth = '';
  selectedDate = '';

  constructor(public db: DataService) {}

  get availableMonths() {
    return [...new Set(this.db.transactions()
      .map(sale => sale.date.slice(0, 7))
      .filter(month => /^\d{4}-\d{2}$/.test(month)))]
      .sort((a, b) => b.localeCompare(a))
      .map(value => ({
        value,
        label: new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(new Date(`${value}-01T12:00:00`))
      }));
  }

  get filteredTransactions() {
    return this.db.transactions()
      .filter(sale => (!this.selectedMonth || sale.date.startsWith(this.selectedMonth))
        && (!this.selectedDate || sale.date === this.selectedDate))
      .sort((a, b) => b.date.localeCompare(a.date)
        || (b.validatedAt || '').localeCompare(a.validatedAt || ''));
  }

  get hasFilters() { return Boolean(this.selectedMonth || this.selectedDate); }
  get itemsSold() { return this.filteredTransactions.reduce((total, sale) => total + sale.productQuantity, 0); }
  get totalRevenue() { return this.filteredTransactions.reduce((total, sale) => total + sale.total, 0); }
  get totalProfit() { return this.filteredTransactions.reduce((total, sale) => total + sale.profit, 0); }
  get totalLabor() { return this.filteredTransactions.reduce((total, sale) => total + sale.labor, 0); }

  onMonthChange(month: string) {
    this.selectedMonth = month;
    if (this.selectedDate && (!month || !this.selectedDate.startsWith(month))) this.selectedDate = '';
  }

  onDateChange(date: string) {
    this.selectedDate = date;
    if (date) this.selectedMonth = date.slice(0, 7);
  }

  clearFilters() {
    this.selectedMonth = '';
    this.selectedDate = '';
  }

  async deleteSale(id: string) {
    if (window.confirm('Supprimer cette vente ? Les articles vendus seront remis en stock.')) {
      await this.db.deleteSale(id);
    }
  }
}