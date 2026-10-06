import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes:Routes=[
{path:'',redirectTo:'dashboard',pathMatch:'full'},
{path:'login',loadComponent:()=>import('./features/login/login.component').then(m=>m.LoginComponent)},
{path:'dashboard',canActivate:[authGuard],loadComponent:()=>import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent)},
{path:'products',canActivate:[authGuard],loadComponent:()=>import('./features/products/products.component').then(m=>m.ProductsComponent)},
{path:'sales',canActivate:[authGuard],loadComponent:()=>import('./features/sales/sales.component').then(m=>m.SalesComponent)},
{path:'sales-register',canActivate:[authGuard],loadComponent:()=>import('./features/sales/sales-register.component').then(m=>m.SalesRegisterComponent)},
{path:'purchases',canActivate:[authGuard],loadComponent:()=>import('./features/purchases/purchases.component').then(m=>m.PurchasesComponent)},
{path:'stock',canActivate:[authGuard],loadComponent:()=>import('./features/stock/stock.component').then(m=>m.StockComponent)},
{path:'clients',canActivate:[authGuard],loadComponent:()=>import('./features/clients/clients.component').then(m=>m.ClientsComponent)},
{path:'suppliers',canActivate:[authGuard],loadComponent:()=>import('./features/suppliers/suppliers.component').then(m=>m.SuppliersComponent)},
{path:'reports',canActivate:[authGuard],loadComponent:()=>import('./features/reports/reports.component').then(m=>m.ReportsComponent)},
{path:'global-stats',canActivate:[authGuard],loadComponent:()=>import('./features/global-stats/global-stats.component').then(m=>m.GlobalStatsComponent)},
{path:'settings',canActivate:[authGuard],loadComponent:()=>import('./features/settings/settings.component').then(m=>m.SettingsComponent)},
{path:'**',redirectTo:'dashboard'}];
