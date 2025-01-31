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

// Fonction pour nettoyer et valider une requête SPARQL
function formatSparqlQuery(query) {
    // Normalisation de base
    let formattedQuery = query
        .replace(/\r\n/g, '\n')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s*\n\s*/g, '\n')
        .replace(/\n+/g, '\n')
        .replace(/\s+/g, ' ');

    // Gestion des guillemets
    formattedQuery = formattedQuery.replace(/"([^"]*)"(?=\s*\.)/g, '\'$1\'');

    // Vérification de la présence du préfixe correct
    if (!formattedQuery.includes('PREFIX : <http://example.org/permis-construire#>')) {
        formattedQuery = 'PREFIX : <http://example.org/permis-construire#>\n' + formattedQuery;
    }

    return formattedQuery;
}

app.post('/translate', async (req, res) => {
    try {
        const { question } = req.body;

        const systemPrompt = `Tu es un expert SPARQL qui traduit les questions en requêtes SPARQL.
        IMPORTANT: 
        1. Dans les requêtes SPARQL, utilise TOUJOURS des guillemets simples (') pour les chaînes de caractères.
        
        2. Pour les statuts de décision, utilise les équivalences suivantes :
           - 'validé', 'approuvé', 'accepté' → utiliser 'Accordé' dans la requête
           - 'en cours', 'en attente' → utiliser 'En cours d\'instruction' dans la requête
           - 'refusé', 'rejeté' → utiliser 'Refusé' dans la requête

        3. Pour les demandeurs, considère les variations possibles :
           - Prénom Nom ou Nom Prénom (ex: "Marie Martin" ou "Martin Marie")
           - Avec ou sans accents
        
        Tu dois TOUJOURS répondre avec un objet JSON valide contenant exactement trois champs :
        - sparqlQuery : la requête SPARQL complète
        - explanation : l'explication en français (inclure les synonymes utilisés si pertinent)
        - resultFormat : "table" ou "cards"
        
        La requête SPARQL doit toujours :
        1. Commencer par le préfixe : PREFIX : <http://example.org/permis-construire#>
        2. Être correctement indentée
        3. Utiliser les bons noms de propriétés (:aPourDemandeur, :situeSurParcelle, etc.)
        4. Utiliser des guillemets simples (') pour les chaînes de caractères
        5. Ne pas contenir de caractères spéciaux non échappés
        
        Si la question mentionne un statut qui est un synonyme (ex: "validé"), inclure dans l'explication que tu utilises le terme officiel "Accordé" dans la requête.`;

        const message = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            temperature: 0,
            system: systemPrompt,
            messages: [{
                role: "user",
                content: `Voici l'ontologie des permis de construire :
                
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
:aPourDemandeur - Relie un permis à son demandeur
:situeSurParcelle - Relie un permis à sa parcelle
:aPourDecision - Relie un permis à sa décision

Question : "${question}"

Réponds avec un objet JSON contenant uniquement :
{
    "sparqlQuery": "la requête SPARQL complète et bien formatée",
    "explanation": "explication en français",
    "resultFormat": "table ou cards"
}`
            }]
        });

        let content = message.content[0].text;
        
        try {
            // Nettoyer la réponse
            content = content.trim();
            if (content.startsWith('```json')) {
                content = content.replace(/```json\n/, '').replace(/\n```$/, '');
            }
            
            // Convertir le contenu en objet JavaScript
            let parsedContent;
            try {
                parsedContent = new Function('return ' + content)();
            } catch (evalError) {
                console.error('Erreur d\'évaluation:', evalError);
                content = content
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .replace(/\\n/g, ' ')
                    .replace(/\\"/g, '"')
                    .trim();
                parsedContent = JSON.parse(content);
            }
            
            const jsonResponse = parsedContent;

            // Vérification et formatage de la requête SPARQL
            if (jsonResponse.sparqlQuery) {
                jsonResponse.sparqlQuery = formatSparqlQuery(jsonResponse.sparqlQuery);
            }

            // Vérification des champs requis
            if (!jsonResponse.sparqlQuery || !jsonResponse.explanation || !jsonResponse.resultFormat) {
                throw new Error("Réponse incomplète");
            }

            // Exécution de la requête SPARQL
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
            res.json({
                sparqlQuery: jsonResponse.sparqlQuery,
                explanation: jsonResponse.explanation,
                resultFormat: jsonResponse.resultFormat,
                results: results
            });

        } catch (parseError) {
            console.error('Erreur de parsing JSON:', content);
            res.status(500).json({
                error: "Format de réponse invalide",
                details: parseError.message,
                rawContent: content
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