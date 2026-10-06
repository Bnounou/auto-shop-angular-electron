import { CommonModule } from '@angular/common';
import { Component, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ReportService, ReportSnapshot } from '../../core/services/report.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-graph-up-arrow me-2" style="color:var(--primary)"></i>Statistiques globales</h2>
        <p>Cumuls historiques de l'activité enregistrée dans AUTO SHOP</p>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-xl col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Revenus cumulés</div>
              <div class="stat-value">{{db.revenue()|number:'1.0-0'}} DA</div>
              <div class="stat-meta">Chiffre d’affaires brut, avant achats et dépenses</div>
            </div>
            <div class="stat-icon bg-primary-subtle text-primary"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Bénéfice net après dépenses</div>
              <div class="stat-value positive">{{db.netProfit()|number:'1.0-0'}} DA</div>
              <div class="stat-meta">{{db.profit()|number:'1.0-0'}} DA de marge - {{db.expenseTotal()|number:'1.0-0'}} DA de dépenses</div>
            </div>
            <div class="stat-icon bg-success-subtle text-success"><i class="bi bi-graph-up-arrow"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Main d'œuvre facturée</div>
              <div class="stat-value">{{db.laborRevenue()|number:'1.0-0'}} DA</div>
              <div class="stat-meta">revenus de service cumulés</div>
            </div>
            <div class="stat-icon bg-info-subtle text-info"><i class="bi bi-tools"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Achats cumulés</div>
              <div class="stat-value">{{purchaseTotal|number:'1.0-0'}} DA</div>
              <div class="stat-meta">{{db.purchases().length}} approvisionnement(s)</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning"><i class="bi bi-truck"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Flux net estimé</div>
              <div class="stat-value">{{estimatedCashFlow|number:'1.0-0'}} DA</div>
              <div class="stat-meta">Ventes + casse-caisse - achats - dépenses, hors caisse de départ</div>
            </div>
            <div class="stat-icon bg-info-subtle text-info"><i class="bi bi-wallet2"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-label">Articles vendus</div>
          <div class="stat-value">{{itemsSold|number:'1.0-0'}}</div>
          <div class="stat-meta">quantité totale</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-label">Ventes enregistrées</div>
          <div class="stat-value">{{db.transactions().length|number:'1.0-0'}}</div>
          <div class="stat-meta">transactions validées</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-label">Références produits</div>
          <div class="stat-value">{{db.products().length|number:'1.0-0'}}</div>
          <div class="stat-meta">catalogue actuel</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-label">Montant du stock actuel</div>
          <div class="stat-value">{{db.stockValue()|number:'1.0-0'}} DA</div>
          <div class="stat-meta">valeur d'achat des articles en stock</div>
        </div>
      </div>
    </div>

    <section class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-wallet2 me-2 text-muted"></i>Dépenses du magasin</h3>
        <span class="text-muted small">Total enregistré : {{db.expenseTotal()|number:'1.0-0'}} DA</span>
      </div>
      <form class="row g-3 p-3 align-items-end" (ngSubmit)="addExpense()">
        <div class="col-md-8">
          <label class="form-label" for="expenseAmount">Montant de la dépense (DA)</label>
          <input id="expenseAmount" class="form-control" type="number" min="1" step="0.01" [(ngModel)]="expenseAmount" name="expenseAmount" required>
        </div>
        <div class="col-md-4">
          <button class="btn btn-primary w-100" type="submit" [disabled]="!expenseAmount || expenseAmount <= 0">
            <i class="bi bi-check2 me-1"></i>Valider la dépense
          </button>
        </div>
      </form>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>Date</th><th class="text-end">Montant</th></tr></thead>
          <tbody>
            <tr *ngFor="let expense of db.expenses()">
              <td>{{expense.date}}</td>
              <td class="text-end">{{expense.amount|number:'1.0-2'}} DA</td>
            </tr>
            <tr *ngIf="!db.expenses().length"><td colspan="2" class="empty">Aucune dépense enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-cash-stack me-2 text-muted"></i>Casse-caisse</h3>
        <span class="text-muted small">Total enregistré : {{db.cashInTotal()|number:'1.0-0'}} DA</span>
      </div>
      <form class="row g-3 p-3 align-items-end" (ngSubmit)="addCashIn()">
        <div class="col-md-6">
          <label class="form-label" for="cashInAmount">Montant de la casse (DA)</label>
          <input id="cashInAmount" class="form-control" type="number" min="1" step="0.01" [(ngModel)]="cashInAmount" name="cashInAmount" required>
        </div>
        <div class="col-md-4">
          <label class="form-label" for="cashInNote">Note</label>
          <input id="cashInNote" class="form-control" type="text" [(ngModel)]="cashInNote" name="cashInNote" placeholder="Ex. caisse du jour">
        </div>
        <div class="col-md-2">
          <button class="btn btn-success w-100" type="submit" [disabled]="!cashInAmount || cashInAmount <= 0">
            <i class="bi bi-check2 me-1"></i>Ajouter
          </button>
        </div>
      </form>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>Date</th><th>Note</th><th class="text-end">Montant</th></tr></thead>
          <tbody>
            <tr *ngFor="let cashIn of db.cashIns()">
              <td>{{cashIn.date}}</td>
              <td>{{cashIn.note || '—'}}</td>
              <td class="text-end">{{cashIn.amount|number:'1.0-2'}} DA</td>
            </tr>
            <tr *ngIf="!db.cashIns().length"><td colspan="3" class="empty">Aucune casse enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-calendar3 me-2 text-muted"></i>Historique mensuel</h3>
        <select class="form-select form-select-sm" style="width:auto;min-width:200px" [(ngModel)]="selectedMonthId" aria-label="Consulter un mois">
          <option value="current-month">Mois en cours</option>
          <option *ngFor="let month of archivedMonths" [value]="month.id">{{monthLabel(month.startDate)}}</option>
        </select>
      </div>
      <div class="row g-3 p-3">
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Revenus</div>
            <div class="stat-value">{{selectedMonth.revenue|number:'1.0-0'}} DA</div>
            <div class="stat-meta">{{monthLabel(selectedMonth.startDate)}}</div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Bénéfice net après dépenses</div>
            <div class="stat-value positive">{{selectedMonth.profit|number:'1.0-0'}} DA</div>
            <div class="stat-meta">Marge {{selectedMonth.grossProfit|number:'1.0-0'}} - dépenses {{selectedMonth.expenseTotal|number:'1.0-0'}} DA</div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Main d'œuvre facturée</div>
            <div class="stat-value">{{selectedMonth.laborRevenue|number:'1.0-0'}} DA</div>
            <div class="stat-meta">revenus de service</div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Achats</div>
            <div class="stat-value">{{selectedMonth.purchaseTotal|number:'1.0-0'}} DA</div>
            <div class="stat-meta">{{selectedMonth.purchaseCount}} approvisionnement(s)</div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Casse-caisse ajoutée</div>
            <div class="stat-value">{{selectedMonth.cashInTotal|number:'1.0-0'}} DA</div>
            <div class="stat-meta">entrée de trésorerie, pas un bénéfice</div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card">
            <div class="stat-label">Flux net estimé</div>
            <div class="stat-value">{{selectedMonth.cashFlow|number:'1.0-0'}} DA</div>
            <div class="stat-meta">ventes + casse - achats - dépenses</div>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>Mois</th><th>Revenus</th><th>Bénéfice net</th><th>Main d'œuvre</th><th>Achats</th><th>Dépenses</th><th>Casse-caisse</th><th>Flux net estimé</th></tr></thead>
          <tbody>
            <tr *ngFor="let month of monthlyHistory">
              <td><b>{{monthLabel(month.startDate)}}</b><span *ngIf="month.id === 'current-month'" class="text-muted small ms-2">En cours</span></td>
              <td>{{month.revenue|number:'1.0-0'}} DA</td>
              <td>{{month.profit|number:'1.0-0'}} DA</td>
              <td>{{month.laborRevenue|number:'1.0-0'}} DA</td>
              <td>{{month.purchaseTotal|number:'1.0-0'}} DA</td>
              <td>{{month.expenseTotal|number:'1.0-0'}} DA</td>
              <td>{{month.cashInTotal|number:'1.0-0'}} DA</td>
              <td><b>{{month.cashFlow|number:'1.0-0'}} DA</b></td>
            </tr>
            <tr *ngIf="!archivedMonths.length"><td colspan="8" class="empty">Les mois clôturés apparaîtront ici.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-calendar-day me-2 text-muted"></i>Historique quotidien</h3>
        <select class="form-select form-select-sm" style="width:auto;min-width:200px" [(ngModel)]="selectedDayDate" aria-label="Consulter une journée">
          <option *ngFor="let day of dailyHistory()" [value]="day.startDate">{{dayLabel(day.startDate)}}</option>
        </select>
      </div>
      <div class="row g-3 p-3">
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Revenus</div>
            <div class="stat-value">{{selectedDay.revenue|number:'1.0-0'}} DA</div>
            <div class="stat-meta">{{dayLabel(selectedDay.startDate)}}</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Bénéfice net après dépenses</div>
            <div class="stat-value positive">{{selectedDay.profit|number:'1.0-0'}} DA</div>
            <div class="stat-meta">Marge {{selectedDay.grossProfit|number:'1.0-0'}} - dépenses {{selectedDay.expenseTotal|number:'1.0-0'}} DA</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Main-d'œuvre</div>
            <div class="stat-value">{{selectedDay.laborRevenue|number:'1.0-0'}} DA</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Achats</div>
            <div class="stat-value">{{selectedDay.purchaseTotal|number:'1.0-0'}} DA</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Articles vendus</div>
            <div class="stat-value">{{selectedDay.itemCount|number:'1.0-0'}}</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Approvisionnements</div>
            <div class="stat-value">{{selectedDay.purchaseCount|number:'1.0-0'}}</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Casse-caisse</div>
            <div class="stat-value">{{selectedDay.cashInTotal|number:'1.0-0'}} DA</div>
          </div>
        </div>
        <div class="col-xl-2 col-md-4 col-6">
          <div class="stat-card">
            <div class="stat-label">Flux net estimé</div>
            <div class="stat-value">{{selectedDay.cashFlow|number:'1.0-0'}} DA</div>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>Journée</th><th>Revenus</th><th>Bénéfice net</th><th>Main-d'œuvre</th><th>Achats</th><th>Dépenses</th><th>Casse-caisse</th><th>Flux net estimé</th><th>Articles vendus</th></tr></thead>
          <tbody>
            <tr *ngFor="let day of dailyHistory()">
              <td><b>{{dayLabel(day.startDate)}}</b></td>
              <td>{{day.revenue|number:'1.0-0'}} DA</td>
              <td>{{day.profit|number:'1.0-0'}} DA</td>
              <td>{{day.laborRevenue|number:'1.0-0'}} DA</td>
              <td>{{day.purchaseTotal|number:'1.0-0'}} DA</td>
              <td>{{day.expenseTotal|number:'1.0-0'}} DA</td>
              <td>{{day.cashInTotal|number:'1.0-0'}} DA</td>
              <td><b>{{day.cashFlow|number:'1.0-0'}} DA</b></td>
              <td>{{day.itemCount|number:'1.0-0'}}</td>
            </tr>
            <tr *ngIf="!dailyHistory().length"><td colspan="9" class="empty">Aucune activité enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-lightbulb me-2 text-muted"></i>Pistes d'amélioration</h3>
        <span class="text-muted small">déduites du stock et des ventes enregistrées</span>
      </div>
      <div class="row g-3 p-3">
        <div class="col-xl-3 col-md-6">
          <div style="height:100%;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)">
            <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-exclamation-triangle text-warning"></i><b>Risque de rupture</b></div>
            <div class="stat-value">{{lowStockProducts.length}}</div>
            <div class="stat-meta">référence(s) au seuil ou en dessous · {{outOfStockCount}} en rupture</div>
            <ul *ngIf="lowStockProducts.length" class="small text-muted ps-3 mt-2 mb-2">
              <li *ngFor="let product of lowStockProducts.slice(0, 3)">{{product.name}} · {{product.quantity}} / seuil {{product.minStock}}</li>
            </ul>
            <div *ngIf="!lowStockProducts.length" class="small text-success mt-2">Aucune référence sous son seuil.</div>
            <a routerLink="/stock" class="small">Vérifier le stock</a>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div style="height:100%;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)">
            <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-box-seam text-warning"></i><b>Stock sans vente</b></div>
            <div class="stat-value">{{dormantStockProducts.length}}</div>
            <div class="stat-meta">référence(s) en stock jamais vendue(s)</div>
            <div class="small mt-2">Valeur d'achat immobilisée : <b>{{dormantStockValue|number:'1.0-0'}} DA</b></div>
            <ul *ngIf="dormantStockProducts.length" class="small text-muted ps-3 mt-2 mb-2">
              <li *ngFor="let product of dormantStockProducts.slice(0, 3)">{{product.name}} · {{product.quantity}} en stock</li>
            </ul>
            <div *ngIf="!dormantStockProducts.length" class="small text-success mt-2">Aucun stock dormant détecté.</div>
            <a routerLink="/products" class="small">Examiner les produits</a>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div style="height:100%;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)">
            <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-graph-down-arrow text-danger"></i><b>Marge à surveiller</b></div>
            <div class="stat-value">{{lowMarginProducts.length}}</div>
            <div class="stat-meta">produit(s) vendu(s) avec une marge estimée sous 15%</div>
            <ul *ngIf="lowMarginProducts.length" class="small text-muted ps-3 mt-2 mb-2">
              <li *ngFor="let product of lowMarginProducts.slice(0, 3)">{{product.name}} · {{product.margin|percent:'1.0-0'}}</li>
            </ul>
            <div *ngIf="!lowMarginProducts.length" class="small text-success mt-2">Aucune marge sous le seuil de vigilance.</div>
            <a routerLink="/products" class="small">Revoir les prix et coûts</a>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div style="height:100%;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)">
            <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-star text-success"></i><b>Catégorie la plus rentable</b></div>
            <div *ngIf="bestCategory" class="stat-value" style="font-size:20px">{{bestCategory.name}}</div>
            <div *ngIf="bestCategory" class="stat-meta">{{bestCategory.profit|number:'1.0-0'}} DA de bénéfice produits</div>
            <div *ngIf="!bestCategory" class="stat-meta mt-2">Les ventes permettront d'identifier la catégorie la plus rentable.</div>
            <div *ngIf="bestCategory" class="small text-muted mt-2">{{bestCategory.qty}} article(s) vendu(s)</div>
            <a routerLink="/products" class="small">Voir le catalogue</a>
          </div>
        </div>
      </div>
    </div>

    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-pie-chart me-2 text-muted"></i>Répartition globale des bénéfices</h3>
        <span class="text-muted small">toute la période enregistrée</span>
      </div>
      <div style="padding:20px">
        <div class="row g-3">
          <div class="col-12 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Bénéfice sur produits</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-shop me-1"></i>Magasin — 40%</div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{db.storeProductShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-badge me-1"></i>Propriétaire — 50%</div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{db.ownerProductShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-workspace me-1"></i>Ouvrier — 10%</div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{db.workerProductShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-12 mt-2 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Main d'œuvre</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-shop me-1"></i>Magasin — 20%</div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{db.storeLaborShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-badge me-1"></i>Propriétaire — 40%</div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{db.ownerLaborShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-workspace me-1"></i>Ouvrier — 40%</div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{db.workerLaborShare()|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-12 mt-2 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Parts estimées; dépenses déduites de la part magasin</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-shop me-1"></i>Magasin</div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{db.storeNetShare()|number:'1.0-0'}} DA</div>
              <div class="stat-meta">{{db.expenseTotal()|number:'1.0-0'}} DA de dépenses déduits</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-badge me-1"></i>Propriétaire</div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{(db.ownerProductShare() + db.ownerLaborShare())|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-workspace me-1"></i>Ouvrier</div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{(db.workerProductShare() + db.workerLaborShare())|number:'1.0-0'}} DA</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3><i class="bi bi-trophy me-2 text-muted"></i>Meilleures ventes historiques</h3>
        <span class="text-muted small">classées par quantité vendue</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>#</th><th>Produit</th><th>Quantité vendue</th><th>Revenus</th></tr></thead>
          <tbody>
            <tr *ngFor="let product of topProducts; let i = index">
              <td>{{i + 1}}</td>
              <td><b>{{product.name}}</b></td>
              <td>{{product.qty|number:'1.0-0'}}</td>
              <td><b>{{product.revenue|number:'1.0-0'}} DA</b></td>
            </tr>
            <tr *ngIf="!topProducts.length"><td colspan="4" class="empty">Aucune vente enregistrée.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class GlobalStatsComponent implements OnInit {
  selectedMonthId = 'current-month';
  selectedDayDate = new Date().toLocaleDateString('sv-SE');
  expenseAmount: number | null = null;
  cashInAmount: number | null = null;
  cashInNote = '';
  constructor(public db: DataService, public reports: ReportService) {}

  async ngOnInit() { await this.reports.initialize(); }

  async addExpense() {
    if (!this.expenseAmount || this.expenseAmount <= 0) return;
    if (await this.db.addExpense(this.expenseAmount)) this.expenseAmount = null;
  }

  async addCashIn() {
    if (!this.cashInAmount || this.cashInAmount <= 0) return;
    if (await this.db.addCashIn(this.cashInAmount, this.cashInNote)) {
      this.cashInAmount = null;
      this.cashInNote = '';
    }
  }

  get purchaseTotal() { return this.db.purchases().reduce((total, purchase) => total + purchase.total, 0); }
  get estimatedCashFlow() { return this.db.revenue() + this.db.cashInTotal() - this.purchaseTotal - this.db.expenseTotal(); }
  get itemsSold() { return this.db.sales().reduce((total, sale) => total + (sale.productId ? sale.quantity : 0), 0); }
  get archivedMonths() { return this.reports.archives().filter(archive => archive.id.startsWith('month:')); }
  get monthlyHistory(): ReportSnapshot[] { return [this.reports.currentPeriod, ...this.archivedMonths]; }
  get selectedMonth() {
    return this.monthlyHistory.find(month => month.id === this.selectedMonthId) || this.reports.currentPeriod;
  }
  readonly dailyHistory = computed(() => {
    const dates = new Set([...this.db.sales(), ...this.db.purchases(), ...this.db.expenses(), ...this.db.cashIns()].map(transaction => transaction.date));
    dates.add(new Date().toLocaleDateString('sv-SE'));
    return [...dates].sort((a, b) => b.localeCompare(a)).map(date => this.reports.forDate(date));
  });
  get selectedDay() { return this.reports.forDate(this.selectedDayDate); }
  dayLabel(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(year, month - 1, day, 12));
  }
  monthLabel(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(new Date(year, month - 1, day, 12));
  }
  get lowStockProducts() { return [...this.db.lowStock()].sort((a, b) => a.quantity - b.quantity); }
  get outOfStockCount() { return this.db.products().filter(product => product.quantity <= 0).length; }
  get dormantStockProducts() {
    const soldIds = new Set(this.db.sales().map(sale => sale.productId));
    return this.db.products().filter(product => product.quantity > 0 && !soldIds.has(product.id));
  }
  get dormantStockValue() {
    return this.dormantStockProducts.reduce((total, product) => total + product.quantity * product.purchasePrice, 0);
  }
  get lowMarginProducts() {
    const margins = new Map<string, {name: string; revenue: number; profit: number}>();
    for (const sale of this.db.sales()) {
      const summary = margins.get(sale.productId) || {name: sale.productName, revenue: 0, profit: 0};
      summary.revenue += sale.unitPrice * sale.quantity;
      summary.profit += sale.productProfit ?? sale.profit;
      margins.set(sale.productId, summary);
    }
    return [...margins.values()]
      .map(product => ({...product, margin: product.revenue ? product.profit / product.revenue : 0}))
      .filter(product => product.margin < 0.15)
      .sort((a, b) => a.margin - b.margin);
  }
  get bestCategory() {
    const categories = new Map<string, {name: string; profit: number; qty: number}>();
    for (const sale of this.db.sales()) {
      const summary = categories.get(sale.category) || {name: sale.category, profit: 0, qty: 0};
      summary.profit += sale.productProfit ?? sale.profit;
      summary.qty += sale.quantity;
      categories.set(sale.category, summary);
    }
    return [...categories.values()].sort((a, b) => b.profit - a.profit)[0] || null;
  }
  get topProducts() {
    const products = new Map<string, {name: string; qty: number; revenue: number}>();
    for (const sale of this.db.sales()) {
      const summary = products.get(sale.productId) || {name: sale.productName, qty: 0, revenue: 0};
      summary.qty += sale.quantity;
      summary.revenue += sale.total;
      products.set(sale.productId, summary);
    }
    return [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }
}