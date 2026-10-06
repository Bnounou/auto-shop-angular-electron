import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { BarcodeService } from '../../core/services/barcode.service';
import { categories, Category, Product } from '../../core/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head">
      <div><h2>Produits</h2><p>Gérez vos références, prix et étiquettes code-barres</p></div>
      <button class="btn btn-primary" (click)="newProduct()"><i class="bi bi-plus-lg me-1"></i>Ajouter un produit</button>
    </div>

    <div class="toolbar row g-2">
      <div class="col-md-7"><input class="form-control" [(ngModel)]="q" placeholder="Rechercher par nom, référence ou code-barres..."></div>
      <div class="col-md-5"><select class="form-select" [(ngModel)]="cat"><option value="">Toutes les catégories</option><option *ngFor="let c of cats" [value]="c">{{c}}</option></select></div>
    </div>

    <div class="panel">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr><th>Produit</th><th>Catégorie</th><th>Code-barres</th><th>Prix achat</th><th>Prix vente</th><th>Main d’œuvre</th><th>Prix étiquette</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td><b>{{p.name}}</b><small class="d-block text-muted">{{p.reference||'—'}} {{p.brand?'· '+p.brand:''}}</small></td>
              <td>{{p.category}}</td><td class="font-monospace">{{p.barcode}}</td>
              <td>{{p.purchasePrice|number:'1.0-0'}} DA</td><td>{{p.salePrice|number:'1.0-0'}} DA</td>
              <td>{{p.labor|number:'1.0-0'}} DA</td><td><b>{{finalPrice(p)|number:'1.0-0'}} DA</b></td>
              <td><span [class.low-stock]="p.quantity<=p.minStock">{{p.quantity}}</span></td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" title="Code-barres" (click)="openBarcode(p)"><i class="bi bi-upc-scan"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="edit(p)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(p)"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
            <tr *ngIf="!filtered.length"><td colspan="9" class="empty">Aucun produit.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="show">
      <div class="app-modal">
        <div class="modal-header px-4 py-3"><h5 class="modal-title">{{form.id?'Modifier':'Nouveau'}} produit</h5><button class="btn-close" (click)="show=false"></button></div>
        <div class="p-4"><div class="row g-3">
          <div class="col-md-6"><label class="form-label">Nom</label><input class="form-control" [(ngModel)]="form.name"></div>
          <div class="col-md-6"><label class="form-label">Catégorie</label><select class="form-select" [(ngModel)]="form.category"><option *ngFor="let c of cats" [value]="c">{{c}}</option></select></div>
          <div class="col-md-6"><label class="form-label">Référence</label><input class="form-control" [(ngModel)]="form.reference"></div>
          <div class="col-md-6"><label class="form-label">Marque</label><input class="form-control" [(ngModel)]="form.brand"></div>
          <div class="col-md-8"><label class="form-label">Code-barres</label><input class="form-control font-monospace" [(ngModel)]="form.barcode"></div>
          <div class="col-md-4 d-flex align-items-end"><button class="btn btn-outline-primary w-100" (click)="form.barcode=barcode.generate(db.products())"><i class="bi bi-upc me-1"></i>Générer</button></div>
          <div class="col-md-4"><label class="form-label">Stock initial</label><input class="form-control" type="number" min="0" [(ngModel)]="form.quantity"></div>
          <div class="col-md-4"><label class="form-label">Prix achat (DA)</label><input class="form-control" type="number" min="0" [(ngModel)]="form.purchasePrice"></div>
          <div class="col-md-4"><label class="form-label">Prix vente (DA)</label><input class="form-control" type="number" min="0" [(ngModel)]="form.salePrice"></div>
          <div class="col-md-6"><label class="form-label">Main d’œuvre (DA)</label><input class="form-control" type="number" min="0" [(ngModel)]="form.labor"><small class="text-muted">0 DA est accepté.</small></div>
          <div class="col-md-6"><label class="form-label">Prix final sur l'étiquette</label><input class="form-control" [value]="finalPrice(form)|number:'1.0-0'" readonly><small class="text-muted">Prix de vente + main d’œuvre.</small></div>
          <div class="col-md-6"><label class="form-label">Seuil minimum</label><input class="form-control" type="number" min="0" [(ngModel)]="form.minStock"></div>
        </div></div>
        <div class="modal-footer px-4 py-3"><button class="btn btn-light" (click)="show=false">Annuler</button><button class="btn btn-primary" (click)="save()">Enregistrer</button></div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="barcodeProduct">
      <div class="app-modal barcode-modal">
        <div class="modal-header px-4 py-3"><div><h5 class="modal-title">Étiquette code-barres</h5><small class="text-muted">Le code contient le nom, le code produit et le prix final.</small></div><button class="btn-close" (click)="barcodeProduct=null"></button></div>
        <div class="p-4 text-center">
          <div class="barcode-label">
            <div class="barcode-name">{{barcodeProduct.name}}</div>
            <svg #barcodeSvg></svg>
            <div class="barcode-code">Code : {{barcodeProduct.barcode}}</div>
            <div class="barcode-price">{{finalPrice(barcodeProduct)|number:'1.0-0'}} DA</div>
            
          </div>
          <div class="mt-3 text-muted small">Valeur encodée : nom + code + prix final</div>
        </div>
        <div class="modal-footer px-4 py-3"><button class="btn btn-light" (click)="barcodeProduct=null">Fermer</button><button class="btn btn-primary" (click)="printBarcode()"><i class="bi bi-printer me-1"></i>Imprimer l'étiquette</button></div>
      </div>
    </div>
  `
})
export class ProductsComponent {
  q = ''; cat = ''; show = false; cats = categories; form = this.blank(); barcodeProduct: Product | null = null;
  @ViewChild('barcodeSvg') barcodeSvg?: ElementRef<SVGElement>;
  constructor(public db: DataService, public barcode: BarcodeService) {}
  get filtered() { const q=this.q.toLowerCase(); return this.db.products().filter(p=>(!this.cat||p.category===this.cat)&&(!q||p.name.toLowerCase().includes(q)||p.barcode.includes(q)||(p.reference||'').toLowerCase().includes(q))); }
  blank(): Product { return {id:crypto.randomUUID(),name:'',category:'Autre',barcode:'',purchasePrice:0,salePrice:0,labor:0,quantity:0,minStock:3}; }
  finalPrice(p: Product) { return this.barcode.finalPrice(p); }
  newProduct(){this.form=this.blank();this.form.barcode=this.barcode.generate(this.db.products());this.show=true;}
  edit(p:Product){this.form={...p};this.show=true;}
  async save(){if(!this.form.name.trim())return;await this.db.upsertProduct({...this.form,purchasePrice:+this.form.purchasePrice,salePrice:+this.form.salePrice,labor:Math.max(0,+this.form.labor),quantity:Math.max(0,+this.form.quantity),minStock:Math.max(0,+this.form.minStock)});this.show=false;}
  async remove(p:Product){if(confirm('Supprimer ce produit ?'))await this.db.deleteProduct(p.id)}
  openBarcode(p: Product){this.barcodeProduct={...p};setTimeout(()=>{if(this.barcodeSvg)this.barcode.render(this.barcodeSvg.nativeElement,p);});}
  printBarcode(){
    if(!this.barcodeProduct||!this.barcodeSvg)return;
    const p=this.barcodeProduct, svg=this.barcodeSvg.nativeElement.outerHTML;
    const win=window.open('','_blank','width=500,height=600'); if(!win)return;
    win.document.write(`<html><head><title>Étiquette ${p.name}</title><style>body{font-family:Arial,sans-serif;text-align:center;margin:0;padding:12mm}.label{width:70mm;margin:auto}.name{font-size:15px;font-weight:700;margin-bottom:4mm}.code{font-family:monospace;font-size:11px;margin-top:2mm}.price{font-size:20px;font-weight:700;margin-top:2mm}svg{max-width:100%;height:auto}</style></head><body><div class="label"><div class="name">${this.escape(p.name)}</div>${svg}<div class="code">Code : ${this.escape(p.barcode)}</div><div class="price">${this.finalPrice(p).toLocaleString('fr-DZ')} DA</div></div><script>window.onload=()=>window.print();</script></body></html>`);win.document.close();
  }
  private escape(s:string){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));}
}
