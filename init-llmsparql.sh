#!/bin/bash
# Créer le script d'installation
echo '#!/bin/bash

# Télécharger Fuseki
wget https://downloads.apache.org/jena/binaries/apache-jena-fuseki-5.3.0.tar.gz

# Extraire dans le dossier fuseki
mkdir -p fuseki
tar -xzf apache-jena-fuseki-5.3.0.tar.gz -C fuseki/
rm apache-jena-fuseki-5.3.0.tar.gz

# Configuration...' > init-llmsparql.sh

chmod +x init-llmsparql.sh