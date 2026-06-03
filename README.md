Bienvenue dans le projet Api pour Pharmacie Centralisee. Ce monorepo gère une plateforme centrale et plusieurs microservices de pharmacie en utilisant Prisma 7 et une architecture modulaire.
🛠 Prérequis

    Node.js: v18+

    PostgreSQL: Instance locale

📦 Installation et démarrage
1. Installation

Grâce aux npm workspaces, installez toutes les dépendances de tous les services en une seule commande depuis la racine du projet :
Bash

npm install

2. Configuration de la base de données

Créez les bases de données nécessaires dans votre terminal PostgreSQL (psql) :
SQL

CREATE DATABASE pharmacy_main;
CREATE DATABASE pharmacy_db1;
CREATE DATABASE pharmacy_db2;
CREATE DATABASE pharmacy_db3;

3. Configuration des variables d'environnement

Créez un fichier .env dans chaque répertoire (main-api, api1, api2, api3) avec vos identifiants locaux.

Exemple main-api/.env :
Extrait de code

DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/pharmacy_main?schema=public"
PORT=3000

Exemple api1/.env :
Extrait de code

DB_HOST="localhost"
DB_USER="postgres"
DB_PASSWORD="VOTRE_MOT_DE_PASSE"
DB_NAME="pharmacy_db1"
DB_PORT=5432
PORT=3001

4. Configuration de Prisma

Pour chaque répertoire d'API, générez le client et synchronisez le schéma :
Bash

cd <nom-du-dossier-api>
npx prisma db push
npx prisma generate

5. Lancement des applications

Naviguez dans chaque répertoire et lancez le serveur de développement :
Bash

cd main-api
npm run dev