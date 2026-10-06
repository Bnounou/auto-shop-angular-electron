import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { DataService } from './core/services/data.service';
@Component({selector:'app-root',standalone:true,imports:[CommonModule,RouterOutlet,RouterLink,RouterLinkActive],template:`
@if (auth.isLoggedIn()) {
<div class="app-shell">
 <aside class="sidebar">
  <div class="brand">
    <span class="brand-mark" role="img" aria-label="AUTO SHOP"></span>
    <div><b>AUTO SHOP</b><small>Gestion automobile</small></div>
  </div>
  <div class="nav-wrap">
   <div class="nav-title">Principal</div>
   <a class="side-link" routerLink="/dashboard" routerLinkActive="active"><i class="bi bi-speedometer2"></i><span>Tableau de bord</span></a>
   <a class="side-link" routerLink="/sales" routerLinkActive="active"><i class="bi bi-cart3"></i><span>Ventes / Caisse</span></a>
  <a class="side-link" routerLink="/sales-register" routerLinkActive="active"><i class="bi bi-journal-text"></i><span>Registre des ventes</span></a>
   <a class="side-link" routerLink="/products" routerLinkActive="active"><i class="bi bi-box-seam"></i><span>Produits</span></a>
   <a class="side-link" routerLink="/stock" routerLinkActive="active">
     <i class="bi bi-clipboard-data"></i><span>Stock</span>
     <span *ngIf="db.lowStock().length" class="badge-count">{{db.lowStock().length}}</span>
   </a>
   <div class="nav-title mt-2">Gestion</div>
   <a class="side-link" routerLink="/purchases" routerLinkActive="active"><i class="bi bi-truck"></i><span>Achats</span></a>
   <a class="side-link" routerLink="/clients" routerLinkActive="active"><i class="bi bi-people"></i><span>Clients</span></a>
   <a class="side-link" routerLink="/suppliers" routerLinkActive="active"><i class="bi bi-building"></i><span>Fournisseurs</span></a>
   <a class="side-link" routerLink="/reports" routerLinkActive="active"><i class="bi bi-bar-chart-line"></i><span>Rapports &amp; stats</span></a>
  <a class="side-link" routerLink="/global-stats" routerLinkActive="active"><i class="bi bi-graph-up-arrow"></i><span>Stats globales</span></a>
   <div class="nav-title mt-2">Système</div>
   <a class="side-link" routerLink="/settings" routerLinkActive="active"><i class="bi bi-gear"></i><span>Paramètres</span></a>
  </div>
  <div class="side-bottom">
    <div class="d-flex align-items-center gap-2" style="font-size:11px;color:#475569">
      <i class="bi bi-shield-check" style="color:#22d3ee"></i>
      <span>Données locales sécurisées</span>
    </div>
    <button class="btn btn-sm btn-outline-secondary w-100 mt-3" type="button" (click)="logout()">
      <i class="bi bi-box-arrow-right me-1"></i>Se déconnecter
    </button>
  </div>
 </aside>
 <section class="content">
  <main class="main"><router-outlet/></main>
 </section>
</div>
} @else {
  <router-outlet/>
}`})
export class AppComponent{
  constructor(public db:DataService, public auth:AuthService, private router:Router){}
  logout(){this.auth.logout(); this.router.navigate(['/login']);}
}
