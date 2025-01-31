#!/bin/bash
cd "$(dirname "$0")/fuseki/apache-jena-fuseki-5.3.0"
./fuseki-server --update --mem /permis
