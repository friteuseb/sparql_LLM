const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/translate', async (req, res) => {
    try {
        const { question } = req.body;
        
        const message = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            temperature: 0, // Réduire la créativité pour des réponses plus consistantes
            system: "Vous êtes un expert en SPARQL qui traduit les questions en langage naturel en requêtes SPARQL valides. Répondez TOUJOURS avec un objet JSON valide contenant exactement sparqlQuery, explanation et resultFormat.",
            messages: [{
                role: "user",
                content: `Tu es un expert en SPARQL qui aide à traduire des questions en langage naturel en requêtes SPARQL valides.
                    
                    Voici l'ontologie des permis de construire :
                    
                    Classes:
                    :PermisConstructe - Permis de construire
                    :Demandeur - Personne demandant le permis
                    :Parcelle - Terrain concerné
                    :ZoneUrbanisme - Zone d'urbanisme
                    :Decision - Décision sur le permis
                    
                    Propriétés:
                    :reference - Référence du permis
                    :dateDepot - Date de dépôt
                    :surface - Surface en m²
                    :hauteur - Hauteur en m
                    :empriseSol - Emprise au sol en m²
                    :nom - Nom du demandeur
                    :email - Email du demandeur
                    :adresse - Adresse de la parcelle
                    :superficie - Superficie de la parcelle
                    :statutDecision - Statut de la décision

                    PREFIX à utiliser : PREFIX : <http://example.org/permis-construire#>

                    Question de l'utilisateur : "${question}"

                    Retourne uniquement un objet JSON avec les champs suivants :
                    - sparqlQuery: la requête SPARQL complète (avec le PREFIX)
                    - explanation: explication en français de ce que fait la requête
                    - resultFormat: "table" ou "cards" selon ce qui est le plus approprié`
            }]
        });

        let content = message.content[0].text;
        let jsonResponse;

        try {
            // Tentative de parse du JSON
            jsonResponse = JSON.parse(content);

            // Vérification de la présence des champs requis
            if (!jsonResponse.sparqlQuery || !jsonResponse.explanation || !jsonResponse.resultFormat) {
                throw new Error("Réponse incomplète du LLM");
            }

            // Vérification que la requête SPARQL contient bien le bon préfixe
            if (!jsonResponse.sparqlQuery.includes('<http://example.org/permis-construire#>')) {
                jsonResponse.sparqlQuery = jsonResponse.sparqlQuery.replace(
                    /PREFIX\s+:\s+<[^>]+>/,
                    'PREFIX : <http://example.org/permis-construire#>'
                );
            }

        } catch (parseError) {
            console.error('Erreur de parsing JSON:', content);
            return res.status(500).json({ 
                error: "Format de réponse invalide",
                details: parseError.message,
                rawContent: content 
            });
        }

        // Exécution de la requête SPARQL sur Fuseki
        try {
            const fusekiResponse = await fetch('http://localhost:3030/permis/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/json'
                },
                body: jsonResponse.sparqlQuery
            });

            if (!fusekiResponse.ok) {
                throw new Error(`Erreur Fuseki: ${fusekiResponse.statusText}`);
            }

            const results = await fusekiResponse.json();
            
            // Envoi de la réponse complète
            res.json({
                sparqlQuery: jsonResponse.sparqlQuery,
                explanation: jsonResponse.explanation,
                resultFormat: jsonResponse.resultFormat,
                results: results
            });

        } catch (fusekiError) {
            console.error('Erreur Fuseki:', fusekiError);
            return res.status(500).json({
                error: "Erreur d'exécution de la requête SPARQL",
                details: fusekiError.message
            });
        }

    } catch (error) {
        console.error('Erreur générale:', error);
        res.status(500).json({ 
            error: "Erreur du serveur",
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});