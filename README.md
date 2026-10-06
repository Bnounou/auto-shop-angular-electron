# AUTO SHOP — Angular + Electron

Application de gestion de magasin de pièces automobiles, développée avec Angular, TypeScript et Electron.

## Architecture
- `src/app/core/models` : modèles métier
- `src/app/core/services` : stockage et logique métier
- `src/app/features` : écrans fonctionnels
- `electron` : processus desktop et IPC sécurisé

## Installation
```bash
npm install
npm start
```

## Electron en développement
```bash
npm run rebuild:native
npm run dev:electron
```

`better-sqlite3` est un module natif. Sous Windows, le rebuild nécessite Python 3 et Visual Studio Build Tools avec la charge de travail « Développement Desktop en C++ ».

## Build desktop
```bash
npm run dist
```

Le build produit les installateurs dans `release/`.

## Stockage SQLite

Dans Electron, la base `autoshop.sqlite` est créée dans le dossier utilisateur Electron. Elle contient les tables `users`, `products`, `sales`, `purchases`, `clients`, `suppliers`, `report_state`, `report_archives` et `app_meta`. Les quantités de stock sont conservées dans `products`; les ventes et achats gardent leurs valeurs historiques.

Au premier lancement, l'application importe une seule fois les anciennes données de `autoshop-data.json` et les clés localStorage `autoshop-data`, `autoshop-users` et `autoshop-report-periods`. Les anciens fichiers et clés ne sont pas supprimés par la migration. En dehors d'Electron, le mode navigateur conserve localStorage comme solution de développement.

Le compte initial est `admin` avec le mot de passe `admin123`; il est créé uniquement lorsqu'aucun compte n'existe.


## Répartition des bénéfices
- Chaque produit possède un champ **Main d’œuvre (DA)**, autorisé à 0.
- Bénéfice net produit = prix de vente - prix d'achat.
- Bénéfice net produit : 10% magasin, 65% propriétaire, 25% ouvrier.
- Main d’œuvre : 10% magasin, 45% propriétaire, 45% ouvrier.
- Les ventes enregistrent ces montants pour conserver les statistiques historiques.

## Code-barres et étiquettes

Chaque produit possède un code-barres généré automatiquement. L'application permet de prévisualiser et d'imprimer une étiquette.

Le contenu encodé dans le CODE128 est : `AS|nom|code|prix-final`, avec le nom et le code URL-encodés et le prix final = prix de vente + main d'œuvre.

L'étiquette imprimée affiche clairement :
- Nom du produit
- Code-barres
- Code produit
- Prix final TTC de l'étiquette (prix de vente + main d'œuvre)
- Détail prix vente + main d'œuvre

Le scanner peut donc récupérer le nom, le code et le prix depuis la valeur encodée.
