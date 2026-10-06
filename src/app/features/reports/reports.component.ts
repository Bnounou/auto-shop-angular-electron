import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ReportService } from '../../core/services/report.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-bar-chart-line me-2" style="color:var(--primary)"></i>Rapports &amp; Statistiques</h2>
        <p>Synthèse mensuelle et répartition journalière des bénéfices</p>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Revenus de la période</div>
              <div class="stat-value">{{period.revenue|number:'1.0-0'}} DA</div>
              <div class="stat-meta">{{period.startDate}} au {{period.endDate}}</div>
            </div>
            <div class="stat-icon bg-primary-subtle text-primary"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Bénéfice brut</div>
              <div class="stat-value positive">{{period.grossProfit|number:'1.0-0'}} DA</div>
              <div class="stat-meta">ventes et main-d’œuvre, avant dépenses</div>
            </div>
            <div class="stat-icon bg-success-subtle text-success"><i class="bi bi-graph-up-arrow"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Bénéfice net après dépenses</div>
              <div class="stat-value positive">{{period.profit|number:'1.0-0'}} DA</div>
              <div class="stat-meta">bénéfice brut - {{period.expenseTotal|number:'1.0-0'}} DA de dépenses</div>
            </div>
            <div class="stat-icon bg-info-subtle text-info"><i class="bi bi-tools"></i></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="stat-label">Achats de marchandises</div>
              <div class="stat-value">{{period.purchaseTotal|number:'1.0-0'}} DA</div>
              <div class="stat-meta">coût d'approvisionnement</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning"><i class="bi bi-truck"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Dépenses</div>
          <div class="stat-value">{{period.expenseTotal|number:'1.0-0'}} DA</div>
          <div class="stat-meta">déduites du bénéfice net</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Casse-caisse</div>
          <div class="stat-value">{{period.cashInTotal|number:'1.0-0'}} DA</div>
          <div class="stat-meta">entrée de caisse, pas un bénéfice</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Flux net estimé</div>
          <div class="stat-value">{{period.cashFlow|number:'1.0-0'}} DA</div>
          <div class="stat-meta">revenus + casse - achats - dépenses</div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="stat-card">
          <div class="stat-label">Main-d’œuvre facturée</div>
          <div class="stat-value">{{period.laborRevenue|number:'1.0-0'}} DA</div>
          <div class="stat-meta">incluse dans les revenus</div>
        </div>
      </div>
    </div>

    <!-- PROFIT SPLIT -->
    <div class="panel mb-4">
      <div class="panel-head">
        <h3><i class="bi bi-pie-chart me-2 text-muted"></i>Répartition des bénéfices</h3>
        <select class="form-select form-select-sm" style="width:auto;min-width:220px" [(ngModel)]="selectedDistributionId" aria-label="Choisir la période de répartition">
          <optgroup label="Journées">
            <option value="today">Aujourd'hui</option>
            <option *ngFor="let date of archivedDays" [value]="'day:' + date">{{dayLabel(date)}}</option>
          </optgroup>
          <optgroup label="Mois">
            <option value="current">Mois en cours</option>
            <option *ngFor="let archived of archivedMonths" [value]="archived.id">{{monthLabel(archived.startDate)}}</option>
          </optgroup>
        </select>
      </div>
      <div style="padding:20px">
        <div class="text-muted small mb-3">{{distribution.startDate}} au {{distribution.endDate}} · {{distribution.itemCount}} article(s) vendu(s)</div>
        <div class="row g-3">
          <div class="col-12 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Bénéfice sur produits</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-shop me-1"></i>Magasin — 40%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{distribution.storeProductShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-person-badge me-1"></i>Propriétaire — 50%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{distribution.ownerProductShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-person-workspace me-1"></i>Ouvrier — 10%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{distribution.workerProductShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-12 mt-2 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Main d'œuvre</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-shop me-1"></i>Magasin — 20%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{distribution.storeLaborShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-person-badge me-1"></i>Propriétaire — 40%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{distribution.ownerLaborShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px">
                <i class="bi bi-person-workspace me-1"></i>Ouvrier — 40%
              </div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{distribution.workerLaborShare|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-12 mt-2 mb-2">
            <h6 class="text-muted" style="font-size:12px;text-transform:uppercase;font-weight:700">Total produits + main-d'œuvre</h6>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-shop me-1"></i>Magasin</div>
              <div style="font-size:22px;font-weight:800;color:var(--info)">{{(distribution.storeProductShare + distribution.storeLaborShare)|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-badge me-1"></i>Propriétaire</div>
              <div style="font-size:22px;font-weight:800;color:var(--primary)">{{(distribution.ownerProductShare + distribution.ownerLaborShare)|number:'1.0-0'}} DA</div>
            </div>
          </div>
          <div class="col-md-4">
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:6px"><i class="bi bi-person-workspace me-1"></i>Ouvrier</div>
              <div style="font-size:22px;font-weight:800;color:var(--success)">{{(distribution.workerProductShare + distribution.workerLaborShare)|number:'1.0-0'}} DA</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TOP PRODUCTS -->
    <div class="panel">
      <div class="panel-head">
        <h3><i class="bi bi-trophy me-2 text-muted"></i>Top produits</h3>
        <span class="text-muted small">{{periodLabel}} · classés par quantité vendue</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>#</th><th>Produit</th><th>Quantité vendue</th><th>Revenus</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let x of top; let i=index">
              <td>
                <span [class]="i<3?'badge':''" [style]="i===0?'background:#ffd700;color:#000':i===1?'background:#c0c0c0;color:#000':i===2?'background:#cd7f32;color:#fff':''">
                  {{i+1}}
                </span>
              </td>
              <td><b>{{x.name}}</b></td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" style="background:var(--primary-glow);color:var(--primary);border:1px solid rgba(37,99,235,.2)">{{x.qty}}</span>
                </div>
              </td>
              <td><b>{{x.revenue|number:'1.0-0'}} DA</b></td>
            </tr>
            <tr *ngIf="!top.length">
              <td colspan="4" class="empty">Aucune vente enregistrée.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit, OnDestroy {
  selectedDistributionId = 'today';
  private periodCheck?: ReturnType<typeof setTimeout>;
  constructor(public db: DataService, public reports: ReportService) {}
  async ngOnInit() {
    await this.reports.initialize();
    this.schedulePeriodCheck();
  }
  ngOnDestroy() { if (this.periodCheck) clearTimeout(this.periodCheck); }
  private schedulePeriodCheck() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.periodCheck = setTimeout(async () => {
      await this.reports.initialize();
      this.schedulePeriodCheck();
    }, nextMidnight.getTime() - now.getTime());
  }
  get period() {
    return this.distribution;
  }
  get distribution() {
    if (this.selectedDistributionId === 'today') return this.reports.today;
    if (this.selectedDistributionId === 'current') return this.reports.currentPeriod;
    if (this.selectedDistributionId.startsWith('day:')) return this.reports.forDate(this.selectedDistributionId.slice(4));
    return this.reports.archives().find(archive => archive.id === this.selectedDistributionId) || this.reports.today;
  }
  get archivedDays() {
    const today = this.reports.today.startDate;
    return [...new Set([...this.db.sales(), ...this.db.purchases(), ...this.db.expenses(), ...this.db.cashIns()].map(transaction => transaction.date))]
      .filter(date => date < today)
      .sort((a, b) => b.localeCompare(a));
  }
  get archivedMonths() { return this.reports.archives().filter(archive => archive.id.startsWith('month:')); }
  get periodLabel() {
    if (this.selectedDistributionId === 'today') return "Aujourd'hui";
    if (this.selectedDistributionId === 'current') return 'Mois en cours';
    if (this.selectedDistributionId.startsWith('day:')) return this.dayLabel(this.selectedDistributionId.slice(4));
    const month = this.archivedMonths.find(archive => archive.id === this.selectedDistributionId);
    return month ? this.monthLabel(month.startDate) : 'Période sélectionnée';
  }
  get top() { return this.distribution.topProducts; }
  dayLabel(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(year, month - 1, day, 12));
  }
  monthLabel(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(new Date(year, month - 1, day, 12));
  }
}
