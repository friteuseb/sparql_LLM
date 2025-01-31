#!/bin/bash

# Se positionner dans le bon répertoire
cd "$(dirname "$0")/fuseki/apache-jena-fuseki-5.3.0"

# Créer la structure de répertoires nécessaire
FUSEKI_BASE="$(pwd)/run"
mkdir -p "$FUSEKI_BASE"
mkdir -p "$FUSEKI_BASE/databases/permis"

# Définir la variable d'environnement FUSEKI_BASE
export FUSEKI_BASE

# Lancer Fuseki avec TDB2
./fuseki-server --tdb2 --loc="$FUSEKI_BASE/databases/permis" --update /permis
