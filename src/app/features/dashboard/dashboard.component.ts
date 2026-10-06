import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({standalone: true, imports: [RouterLink], template: `
		<div class="welcome-page">
			<div class="welcome-icon"><i class="bi bi-car-front-fill"></i></div>
			<h1>Bienvenue dans AUTO SHOP</h1>
			<p>Gérez simplement votre magasin de pièces automobiles.</p>

			<div class="welcome-actions">
				<a class="welcome-action primary" routerLink="/sales">
					<i class="bi bi-cart3"></i>
					<span>Nouvelle vente</span>
				</a>
				<a class="welcome-action" routerLink="/products">
					<i class="bi bi-box-seam"></i>
					<span>Gérer les produits</span>
				</a>
				<a class="welcome-action" routerLink="/stock">
					<i class="bi bi-clipboard-data"></i>
					<span>Consulter le stock</span>
				</a>
				<a class="welcome-action" routerLink="/clients">
					<i class="bi bi-people"></i>
					<span>Gérer les clients</span>
				</a>
			</div>
		</div>
	`
})
export class DashboardComponent {}
