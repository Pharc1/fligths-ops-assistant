# Flight Ops AI

POC d'un système agentique pour l'aide à la maintenance aéronautique.
L'objectif est d'analyser des rapports d'incidents (logs pilotes) et de proposer des procédures de résolution via une architecture **RAG agentique**.


## Données Synthétiques

Pour des raisons de confidentialité et de démonstration, ce projet n'utilise pas de données réelles.

Les données ont été **générées synthétiquement par IA** (Claude 4.5 Sonnet) pour simuler un environnement réaliste :
- **Avion fictif** : "AeroJet 3300"
- **Documents** : Manuels de maintenance (ATA 29 Hydraulique), Bulletins de service, Logs d'incidents passés.
- **Scénario** : Panne complexe sur une valve de régulation (PT-42) nécessitant de croiser plusieurs sources d'information.

Les fichiers bruts sont situés dans le dossier `/data`.

## Setup

```bash
poetry install
# Configurer le .env avec GOOGLE_API_KEY
```
## Stack
- Python 3.12 (Poetry)
- Ruff / Pytest
- Pydantic Settings

