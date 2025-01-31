# LLM SPARQL - Interface en Langage Naturel pour Permis de Construire

Ce projet propose une interface en langage naturel permettant d'interroger une base de données RDF/SPARQL contenant des informations sur les permis de construire. Il utilise l'API Claude d'Anthropic pour traduire les questions en langage naturel en requêtes SPARQL.

## Architecture du Projet

```
LLMSPARQL/
├── data/
│   └── data.ttl              # Données des permis de construire
├── fuseki/                   # Serveur Apache Jena Fuseki
├── ontology/
│   └── ontologie.ttl         # Ontologie des permis de construire
├── public/
│   └── index.html            # Interface utilisateur
├── .env                      # Configuration (clés API)
├── server.js                 # Serveur Node.js
├── init-llmsparql.sh        # Script d'initialisation
├── start-fuseki.sh          # Script de démarrage Fuseki
└── package.json             # Dépendances Node.js
```

## Ontologie des Permis de Construire

### Classes Principales
- `PermisConstructe` : Demande de permis de construire
- `Demandeur` : Personne ou entité demandant le permis
- `Parcelle` : Terrain concerné par la demande
- `ZoneUrbanisme` : Zone d'urbanisme
- `Decision` : Décision sur le permis
- `Document` : Documents associés au permis

### Propriétés Principales
- `reference` : Référence du permis
- `dateDepot` : Date de dépôt
- `surface` : Surface en m²
- `hauteur` : Hauteur en m
- `empriseSol` : Emprise au sol en m²
- `nom` : Nom du demandeur
- `email` : Email du demandeur
- `adresse` : Adresse de la parcelle
- `superficie` : Superficie de la parcelle
- `statutDecision` : Statut de la décision

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd llmsparql
```

2. Installez les dépendances Node.js :
```bash
npm install
```

3. Créez un fichier `.env` avec votre clé API Anthropic :
```
ANTHROPIC_API_KEY=votre_clé_api_ici
```

4. Démarrez le serveur Fuseki :
```bash
./start-fuseki.sh
```

5. Dans un nouveau terminal, démarrez le serveur Node.js :
```bash
node server.js
```

6. Accédez à l'interface via : http://localhost:3001

## Données de Test

Le fichier `data.ttl` contient des exemples de permis de construire avec :
- Deux permis de construire (PC_2024_001 et PC_2024_002)
- Différents demandeurs (Jean Dupont, Marie Martin)
- Différentes zones (UA, UB)
- Différents statuts de décision (Accordé, En cours d'instruction)

## Questions de Test

Voici quelques exemples de questions que vous pouvez poser :

### Recherches Simples
- "Quels sont tous les permis de construire ?"
- "Montre-moi les permis accordés"
- "Liste des permis en cours d'instruction"

### Recherches par Critères
- "Quels sont les permis avec une hauteur supérieure à 7m ?"
- "Montre-moi les projets avec une surface de plus de 100m²"
- "Quels sont les permis dans la zone UA ?"

### Recherches par Demandeur
- "Quel est le permis déposé par Jean Dupont ?"
- "Montre-moi les informations du projet de Marie Martin"

### Recherches par Localisation
- "Quel projet est situé au 15 rue des Lilas ?"
- "Quelles sont les caractéristiques du projet avenue des Roses ?"

### Recherches Combinées
- "Quelle est la surface du projet de Jean Dupont ?"
- "Quel est le statut du permis situé au 15 rue des Lilas ?"
- "Quels sont les permis accordés dans la zone UA ?"

## Fonctionnalités

- Traduction automatique des questions en langage naturel vers SPARQL
- Affichage de la requête SPARQL générée
- Explication en français de la requête
- Présentation des résultats en format tableau ou carte
- Support des requêtes complexes combinant plusieurs critères

## Technologies Utilisées

- Apache Jena Fuseki : Base de données RDF/SPARQL
- Node.js & Express : Serveur backend
- API Claude (Anthropic) : Traduction langage naturel → SPARQL
- HTML/JavaScript : Interface utilisateur

## Limitations Actuelles

- Les questions très complexes peuvent nécessiter plusieurs requêtes
- Certains types de jointures complexes peuvent ne pas être correctement générés
- Les requêtes de modification (INSERT/UPDATE) ne sont pas supportées

## Contribution

Pour contribuer au projet :
1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité
3. Soumettez une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.