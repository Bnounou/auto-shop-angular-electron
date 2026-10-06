import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BarcodeService } from '../../core/services/barcode.service';
import { DataService } from '../../core/services/data.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h2><i class="bi bi-cart3 me-2" style="color:var(--primary)"></i>Ventes / Caisse</h2>
        <p>Point de vente et historique des transactions</p>
      </div>
    </div>

    <div class="pos">
      <!-- PRODUCT SEARCH -->
      <section class="panel">
        <div class="panel-head">
          <h3><i class="bi bi-search me-2 text-muted"></i>Sélectionner un produit</h3>
          <div style="position:relative">
            <i class="bi bi-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
            <input #scanInput class="search-small" style="padding-left:30px" [(ngModel)]="q" (keydown.enter)="scan()" placeholder="Scanner ou rechercher..." autofocus>
          </div>
        </div>
        <div class="product-grid">
          <button *ngFor="let p of found" class="product-tile" (click)="add(p)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <b>{{p.name}}</b>
              <span class="badge" [class.badge-success]="p.quantity>p.minStock" [class.badge-warn]="p.quantity<=p.minStock&&p.quantity>0">
                {{p.quantity}}
              </span>
            </div>
            <small style="font-family:monospace;font-size:10px">{{p.barcode}}</small>
            <strong style="display:block;margin-top:6px">{{p.salePrice|number:'1.0-0'}} DA</strong>
            <span *ngIf="p.labor" style="font-size:10px;color:var(--text-muted)">+ MO {{p.labor|number:'1.0-0'}} DA</span>
          </button>
          <div *ngIf="!found.length" class="empty" style="grid-column:1/-1;padding:30px">
            <i class="bi bi-search" style="font-size:24px;opacity:.3;display:block;margin-bottom:8px"></i>
            Aucun produit disponible
          </div>
        </div>
      </section>

      <!-- CART -->
      <section class="panel cart">
        <div class="panel-head">
          <h3><i class="bi bi-receipt me-2 text-muted"></i>Panier</h3>
          <div class="d-flex align-items-center gap-2">
            <span class="badge" style="background:var(--primary-glow);color:var(--primary);border:1px solid rgba(37,99,235,.2)">
              {{cart.length}} article(s)
            </span>
            <button class="btn btn-sm btn-outline-primary" type="button" (click)="holdCart()" [disabled]="!hasCurrentCart" title="Mettre ce panier en attente et en commencer un autre">
              <i class="bi bi-pause-circle me-1"></i>Mettre en attente
            </button>
          </div>
        </div>
        <div *ngIf="heldCarts.length" class="px-3 pt-2">
          <div class="small text-muted mb-2">Paniers en attente ({{heldCarts.length}})</div>
          <div *ngFor="let held of heldCarts" class="d-flex align-items-center justify-content-between gap-2 border rounded p-2 mb-2">
            <span class="text-truncate">
              <b>{{held.clientName || ('Panier ' + held.id.slice(0, 6))}}</b>
              <small class="d-block text-muted">{{held.items.length}} article(s) · {{held.heldAt|date:'short'}}</small>
            </span>
            <span class="d-flex gap-1 flex-shrink-0">
              <button class="btn btn-sm btn-outline-primary" type="button" (click)="resumeCart(held.id)" title="Reprendre ce panier">
                <i class="bi bi-play-circle me-1"></i>Reprendre
              </button>
              <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteHeldCart(held.id)" title="Supprimer ce panier en attente" [attr.aria-label]="'Supprimer ' + (held.clientName || 'le panier en attente')">
                <i class="bi bi-trash"></i>
              </button>
            </span>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;min-height:0">
          <div *ngFor="let x of cart" class="cart-row">
            <span>
              <b>{{x.product.name}}</b>
              <small>{{x.product.salePrice|number:'1.0-0'}}
                <span *ngIf="x.product.labor"> + MO {{x.product.labor|number:'1.0-0'}}</span> DA/u
              </small>
            </span>
            <input type="number" min="0.1" step="0.1" [max]="x.product.quantity" [(ngModel)]="x.quantity">
            <strong>{{(x.product.salePrice+(x.product.labor||0))*x.quantity|number:'1.0-0'}} DA</strong>
            <button (click)="remove(x.product.id)" title="Retirer"><i class="bi bi-x-lg"></i></button>
          </div>
          <div *ngIf="!cart.length" class="empty" style="padding:30px;flex-direction:column;display:flex;align-items:center;gap:8px">
            <i class="bi bi-cart-x" style="font-size:28px;opacity:.25"></i>
            <span>Panier vide</span>
          </div>
        </div>
        <div class="cart-total" style="display:block">
          <div class="d-flex justify-content-between">
            <span>Sous-total</span>
            <span>{{subtotal|number:'1.0-0'}} DA</span>
          </div>
          <div *ngIf="laborCharge > 0" class="d-flex justify-content-between mt-1">
            <span>Main-d'œuvre</span>
            <span>+{{laborCharge|number:'1.0-0'}} DA</span>
          </div>
          <div *ngIf="discount > 0" class="d-flex justify-content-between text-success mt-1">
            <span>Remise</span>
            <span>-{{discount|number:'1.0-0'}} DA</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span>Total à payer</span>
            <strong>{{total|number:'1.0-0'}} DA</strong>
          </div>
        </div>
        <div style="padding:12px 16px">
          <label class="form-label mb-1" for="clientName">Nom du client (facultatif)</label>
          <input id="clientName" class="form-control mb-3" type="text" maxlength="100" [(ngModel)]="clientName" name="clientName" placeholder="Ex. Ahmed Benali">
          <label class="form-label mb-1" for="laborCharge">Main-d'œuvre (DA)</label>
          <input id="laborCharge" class="form-control mb-3" type="number" min="0" [(ngModel)]="laborCharge" placeholder="0">
          <label class="form-label mb-1" for="discount">Remise sur les produits (DA)</label>
          <input id="discount" class="form-control mb-3" type="number" min="0" [max]="discountableSubtotal" [(ngModel)]="discount" placeholder="0">
          <button class="btn btn-primary w-100" style="padding:12px;font-size:15px;font-weight:600"
            [disabled]="!canCheckout" (click)="checkout()">
            <i class="bi bi-check2-circle me-2"></i>Enregistrer la vente
          </button>
        </div>
      </section>
    </div>

    <!-- HISTORY -->
    <section class="panel history">
      <div class="panel-head">
        <h3><i class="bi bi-clock-history me-2 text-muted"></i>Historique des ventes</h3>
        <span class="text-muted small">{{db.transactions().length}} transaction(s)</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Date</th><th>Articles</th><th>Qté</th><th>Vendeur</th>
              <th>Total</th><th>Bénéfice</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let transaction of db.transactions().slice(0,50)">
              <td><span style="font-family:monospace;font-size:12px">{{transaction.date}}</span></td>
              <td>
                <div *ngFor="let item of transaction.items" class="d-flex align-items-center justify-content-between gap-2">
                  <span><b>{{item.productName}}</b><small class="text-muted d-block">{{item.productId ? '× ' + item.quantity + ' · ' + (item.unitPrice|number:'1.0-0') + ' DA/u' : 'Prestation de main-d’œuvre'}}</small></span>
                  <button *ngIf="item.productId" class="btn btn-sm btn-outline-primary" (click)="edit(item)" title="Modifier cet article"><i class="bi bi-pencil"></i></button>
                </div>
              </td>
              <td>{{transaction.productQuantity || '—'}}</td>
              <td>{{transaction.seller || 'Ancienne vente'}}<small *ngIf="transaction.clientName" class="d-block text-muted">Client : {{transaction.clientName}}</small></td>
              <td><b>{{transaction.total|number:'1.0-0'}} DA</b></td>
              <td class="positive">{{transaction.profit|number:'1.0-0'}} DA</td>
              <td>
                <button class="btn btn-sm btn-outline-danger" (click)="cancel(transaction.id)" title="Annuler toute la vente">
                  <i class="bi bi-x-lg"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="!db.transactions().length">
              <td colspan="7" class="empty">Aucune vente enregistrée.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div *ngIf="editing" class="modal-backdrop" (click)="cancelEdit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3><i class="bi bi-pencil me-2" style="color:var(--primary)"></i>Modifier la vente</h3>
          <button type="button" (click)="cancelEdit()" aria-label="Fermer"><i class="bi bi-x-lg"></i></button>
        </div>
        <div style="padding:20px">
          <label class="form-label" for="editPrice">Prix de vente unitaire (DA)</label>
          <input id="editPrice" class="form-control mb-3" type="number" min="0" [(ngModel)]="editing.price">
          <label class="form-label" for="editQuantity">Quantité</label>
          <input id="editQuantity" class="form-control mb-3" type="number" min="1" [(ngModel)]="editing.quantity">
          <label class="form-label" for="editDiscount">Remise sur le produit (DA)</label>
          <input id="editDiscount" class="form-control" type="number" min="0" [max]="editing.quantity * editing.price" [(ngModel)]="editing.discount">
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline-secondary" type="button" (click)="cancelEdit()">Annuler</button>
          <button class="btn btn-primary" type="button" (click)="saveEdit()"><i class="bi bi-check2 me-1"></i>Enregistrer</button>
        </div>
      </div>
    </div>
  `
})
export class SalesComponent implements AfterViewInit, OnInit, OnDestroy {
  q = ''; discount = 0; laborCharge = 0; cart: {product: any; quantity: number}[] = [];
  clientName = '';
  private readonly cartStorageKey = 'autoshop-pos-cart';
  private readonly heldCartStorageKey = 'autoshop-pos-held-carts';
  heldCarts: {id: string; items: {productId: string; quantity: number}[]; discount: number; laborCharge: number; clientName: string; heldAt: string}[] = [];
  @ViewChild('scanInput') scanInput?: ElementRef<HTMLInputElement>;
  editing: any = null;
  edit(s: any) { this.editing = {id: s.id, price: s.unitPrice, quantity: s.quantity, discount: s.discount || 0}; }
  constructor(public db: DataService, private barcode: BarcodeService, private auth: AuthService) {}
  ngOnInit() { this.restoreHeldCarts(); this.restoreCart(); }
  ngAfterViewInit() { this.focusScan(); }
  ngOnDestroy() { this.persistCart(); }
  private persistCart() {
    const payload = this.cart
      .filter(item => item && item.product && item.product.id)
      .map(item => ({ productId: item.product.id, quantity: Number(item.quantity) || 0 }));
    sessionStorage.setItem(this.cartStorageKey, JSON.stringify(payload));
  }
  private restoreCart() {
    try {
      const raw = sessionStorage.getItem(this.cartStorageKey);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!Array.isArray(payload)) return;
      const restored = payload
        .map(item => {
          const product = this.db.products().find(p => p.id === item.productId);
          if (!product || !Number(item.quantity) || Number(item.quantity) <= 0) return null;
          return { product, quantity: Math.min(Number(item.quantity), product.quantity) };
        })
        .filter((item): item is {product: any; quantity: number} => !!item);
      this.cart = restored;
    } catch {
      this.cart = [];
    }
  }
  private restoreHeldCarts() {
    try {
      const raw = localStorage.getItem(this.heldCartStorageKey);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!Array.isArray(payload)) return;
      this.heldCarts = payload
        .filter(item => item && typeof item.id === 'string' && Array.isArray(item.items))
        .map(item => ({
          id: item.id,
          items: item.items
            .filter((entry: any) => entry && typeof entry.productId === 'string' && Number(entry.quantity) > 0)
            .map((entry: any) => ({productId: entry.productId, quantity: Number(entry.quantity)})),
          discount: Math.max(0, Number(item.discount) || 0),
          laborCharge: Math.max(0, Number(item.laborCharge) || 0),
          clientName: typeof item.clientName === 'string' ? item.clientName : '',
          heldAt: typeof item.heldAt === 'string' ? item.heldAt : new Date().toISOString()
        }));
    } catch {
      this.heldCarts = [];
    }
  }
  private persistHeldCarts() {
    localStorage.setItem(this.heldCartStorageKey, JSON.stringify(this.heldCarts));
  }
  get hasCurrentCart() { return this.cart.length > 0 || Number(this.laborCharge) > 0; }
  private saveCurrentAsHeld() {
    if (!this.hasCurrentCart) return;
    this.heldCarts = [{
      id: crypto.randomUUID(),
      items: this.cart.map(item => ({productId: item.product.id, quantity: Number(item.quantity) || 0})),
      discount: Math.max(0, Number(this.discount) || 0),
      laborCharge: Math.max(0, Number(this.laborCharge) || 0),
      clientName: this.clientName.trim(),
      heldAt: new Date().toISOString()
    }, ...this.heldCarts];
  }
  private clearCurrentCart() {
    this.cart = [];
    this.discount = 0;
    this.laborCharge = 0;
    this.clientName = '';
    sessionStorage.removeItem(this.cartStorageKey);
  }
  holdCart() {
    if (!this.hasCurrentCart) return;
    this.saveCurrentAsHeld();
    this.persistHeldCarts();
    this.clearCurrentCart();
  }
  resumeCart(id: string) {
    const held = this.heldCarts.find(item => item.id === id);
    if (!held) return;
    this.saveCurrentAsHeld();
    this.cart = held.items
      .map(item => {
        const product = this.db.products().find(entry => entry.id === item.productId);
        return product ? {product, quantity: item.quantity} : null;
      })
      .filter((item): item is {product: any; quantity: number} => item !== null);
    this.discount = held.discount;
    this.laborCharge = held.laborCharge;
    this.clientName = held.clientName;
    this.heldCarts = this.heldCarts.filter(item => item.id !== id);
    this.persistHeldCarts();
    this.persistCart();
  }
  deleteHeldCart(id: string) {
    this.heldCarts = this.heldCarts.filter(item => item.id !== id);
    this.persistHeldCarts();
  }
  get found() {
    const q = this.q.toLowerCase();
    return this.db.products().filter(p => (!q || p.name.toLowerCase().includes(q) || p.barcode.includes(q)) && p.quantity > 0).slice(0, 30);
  }
  get subtotal() { return this.cart.reduce((s, x) => s + (x.product.salePrice + (x.product.labor || 0)) * x.quantity, 0); }
  get discountableSubtotal() { return this.cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0); }
  get grossTotal() { return this.subtotal + (Number(this.laborCharge) || 0); }
  get total() { return Math.max(0, this.grossTotal - Math.min(Number(this.discount) || 0, this.discountableSubtotal)); }
  get canCheckout() { return this.cart.length > 0 || Number(this.laborCharge) > 0; }
  add(p: any) {
    const x = this.cart.find(x => x.product.id === p.id);
    if (x) x.quantity = Math.min((Number(x.quantity) || 0) + 1, p.quantity);
    else this.cart.push({product: p, quantity: 1});
    this.persistCart();
  }
  scan() {
    const value = this.q.trim();
    if (!value) return;
    const payload = this.barcode.parse(value);
    const code = payload?.code ?? value;
    const product = this.db.products().find(p => p.barcode.trim() === code);
    if (!product) {
      alert('Produit introuvable pour ce code-barres.');
      this.focusScan();
      return;
    }
    if (product.quantity <= 0) {
      alert('Ce produit est en rupture de stock.');
      this.focusScan();
      return;
    }
    this.add(product);
    this.q = '';
    this.focusScan();
  }
  private focusScan() { setTimeout(() => this.scanInput?.nativeElement.focus()); }
  remove(id: string) {
    this.cart = this.cart.filter(x => x.product.id !== id);
    this.persistCart();
  }
  async checkout() {
    this.laborCharge = Math.max(0, Number(this.laborCharge) || 0);
    if (!this.cart.length && this.laborCharge <= 0) return;
    for (const x of this.cart) {
      const qty = Number(x.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || qty > x.product.quantity + 1e-9) {
        alert('Stock insuffisant pour ' + x.product.name);
        return;
      }
    }
    this.discount = Math.max(0, Math.min(Number(this.discount) || 0, this.discountableSubtotal));
    const user = this.auth.currentUser();
    await this.db.addSale(this.cart.map(x => ({product: x.product, quantity: x.quantity, price: x.product.salePrice})), this.discount, user ? {id: user.id, name: user.displayName} : undefined, this.laborCharge, this.clientName);
    this.clearCurrentCart();
  }
  async saveEdit() {
    if (!this.editing) return;
    const saved = await this.db.updateSale(this.editing.id, this.editing.price, this.editing.quantity, this.editing.discount);
    if (!saved) alert('Prix, quantité invalides ou stock insuffisant.');
    else this.editing = null;
  }
  cancelEdit() { this.editing = null; }
  async cancel(id: string) { if (confirm('Annuler cette vente ?')) await this.db.deleteSale(id); }
}
