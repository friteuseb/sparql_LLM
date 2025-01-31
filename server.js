// server.js
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

                    Question de l'utilisateur : "${question}"

                    Retourne uniquement un objet JSON avec les champs suivants :
                    - sparqlQuery: la requête SPARQL complète (avec les PREFIX nécessaires)
                    - explanation: explication en français de ce que fait la requête
                    - resultFormat: "table" ou "cards" selon ce qui est le plus approprié`
            }]
        });

        const content = message.content[0].text;
        // Parse the JSON response
        const jsonResponse = JSON.parse(content);
        res.json(jsonResponse);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});