"""
UI tools — structurent les données pour le frontend.

Ces tools ne font pas de traitement backend. L'agent a déjà trouvé l'information
via rag_search, il appelle ces tools pour la présenter de façon structurée.
Le stream SSE émet un événement {"type": "widget", "widget": "<nom>", "data": {...}}
que le frontend intercepte pour rendre le composant correspondant.

Tools d'affichage (appelables à tout moment) :
  display_document           → extrait de doc avec highlight
  display_historical_logs    → tableau journal maintenance
  display_telemetry          → jauge valeur/limites
  display_part_identification → carte identité pièce + 3D
  start_procedure_sequence   → lance une procédure pas à pas

Tools cycle de vie procédure :
  advance_procedure_step     → passe à l'étape suivante
  end_procedure_sequence     → clôture la procédure
"""

import json

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

# Noms des UI tools — utilisés dans agent_service.py pour émettre l'événement "widget"
UI_TOOL_NAMES = {
    "display_document",
    "display_historical_logs",
    "display_telemetry",
    "display_part_identification",
    "start_procedure_sequence",
    "advance_procedure_step",
    "end_procedure_sequence",
}


class DisplayDocumentInput(BaseModel):
    ata_chapter: str = Field(description="Référence ATA ex: 32-30-00")
    procedure_title: str = Field(description="Titre de la procédure ou section documentaire")
    full_text: str = Field(description="Texte complet du passage documentaire")
    highlight_snippet: str = Field(description="Phrase ou valeur clé à mettre en évidence dans le texte")


class LogEntry(BaseModel):
    date: str
    cycles: int
    action: str
    tech_id: str
    is_anomaly: bool


class DisplayHistoricalLogsInput(BaseModel):
    aircraft_msn: str = Field(description="Numéro MSN de l'appareil")
    logs: list[LogEntry] = Field(description="Entrées du journal de maintenance, chronologiques")


class DisplayTelemetryInput(BaseModel):
    parameter_name: str = Field(description="Nom du paramètre mesuré")
    current_value: float = Field(description="Valeur actuelle mesurée")
    unit: str = Field(description="Unité ex: PSI, °C, mm")
    min_limit: float = Field(description="Limite basse acceptable")
    max_limit: float = Field(description="Limite haute acceptable")
    status: str = Field(description="nominal | warning | critical")


class DisplayPartIdentificationInput(BaseModel):
    part_name: str = Field(description="Nom complet de la pièce")
    part_number: str = Field(description="Référence P/N de la pièce")
    zone: str = Field(description="Zone avion ex: Zone 400 - Engine L")
    model_3d_id: str = Field(description="Identifiant asset 3D pour le visualiseur frontend")


class ProcedureStep(BaseModel):
    step_index: int
    type: str = Field(description="action | warning | note")
    text: str


class StartProcedureSequenceInput(BaseModel):
    procedure_id: str = Field(description="Identifiant unique ex: PROC-HYD-001")
    title: str = Field(description="Titre complet de la procédure")
    steps: list[ProcedureStep] = Field(description="Liste ordonnée des étapes")


class AdvanceProcedureStepInput(BaseModel):
    procedure_id: str = Field(description="ID de la procédure en cours")
    next_step_index: int = Field(description="Index de la prochaine étape à afficher")


class EndProcedureSequenceInput(BaseModel):
    procedure_id: str = Field(description="ID de la procédure à clôturer")
    reason: str = Field(
        default="completed",
        description="completed | aborted — completed si toutes les étapes sont faites, aborted si arrêt demandé",
    )


def build_ui_tools() -> list[StructuredTool]:

    def display_document(ata_chapter: str, procedure_title: str, full_text: str, highlight_snippet: str) -> str:
        return json.dumps({
            "ata_chapter": ata_chapter,
            "procedure_title": procedure_title,
            "full_text": full_text,
            "highlight_snippet": highlight_snippet,
        })

    def display_historical_logs(aircraft_msn: str, logs: list[dict]) -> str:
        return json.dumps({"aircraft_msn": aircraft_msn, "logs": logs})

    def display_telemetry(
        parameter_name: str, current_value: float, unit: str,
        min_limit: float, max_limit: float, status: str,
    ) -> str:
        return json.dumps({
            "parameter_name": parameter_name,
            "current_value": current_value,
            "unit": unit,
            "min_limit": min_limit,
            "max_limit": max_limit,
            "status": status,
        })

    def display_part_identification(part_name: str, part_number: str, zone: str, model_3d_id: str) -> str:
        return json.dumps({
            "part_name": part_name,
            "part_number": part_number,
            "zone": zone,
            "model_3d_id": model_3d_id,
        })

    def start_procedure_sequence(procedure_id: str, title: str, steps: list[dict]) -> str:
        return json.dumps({
            "procedure_id": procedure_id,
            "title": title,
            "current_step_index": 1,
            "steps": steps,
        })

    def advance_procedure_step(procedure_id: str, next_step_index: int) -> str:
        return json.dumps({
            "procedure_id": procedure_id,
            "current_step_index": next_step_index,
        })

    def end_procedure_sequence(procedure_id: str, reason: str = "completed") -> str:
        return json.dumps({
            "procedure_id": procedure_id,
            "reason": reason,
        })

    return [
        StructuredTool.from_function(
            func=display_document,
            name="display_document",
            args_schema=DisplayDocumentInput,
            description=(
                "Afficher visuellement un extrait de documentation officielle avec une valeur ou phrase mise en évidence. "
                "Appeler SYSTÉMATIQUEMENT après rag_search dès que tu cites une valeur chiffrée, une limite, "
                "ou une procédure issue d'un manuel — ne jamais paraphraser sans montrer la source. "
                "Appeler aussi si le technicien dit 'montre-moi', 'affiche la doc', 'c'est écrit où'."
            ),
        ),
        StructuredTool.from_function(
            func=display_historical_logs,
            name="display_historical_logs",
            args_schema=DisplayHistoricalLogsInput,
            description=(
                "Afficher le journal de maintenance d'un appareil sous forme de tableau chronologique. "
                "Appeler quand tu trouves des incidents passés pertinents ou quand le technicien demande "
                "l'historique d'un appareil ou d'un composant. "
                "Mettre is_anomaly=true sur chaque entrée suspecte ou liée au problème actuel — "
                "elles s'afficheront en orange pour attirer l'attention."
            ),
        ),
        StructuredTool.from_function(
            func=display_telemetry,
            name="display_telemetry",
            args_schema=DisplayTelemetryInput,
            description=(
                "Afficher une valeur mesurée sur une jauge avec ses limites min/max réglementaires. "
                "Appeler quand une valeur chiffrée est mentionnée (pression, température, usure, couple, etc.) "
                "et que tu connais les limites du manuel. "
                "Choisir status=nominal si dans les limites, warning si proche du seuil, critical si hors limite."
            ),
        ),
        StructuredTool.from_function(
            func=display_part_identification,
            name="display_part_identification",
            args_schema=DisplayPartIdentificationInput,
            description=(
                "Afficher la carte d'identité d'une pièce (nom, P/N, zone avion) et charger son modèle 3D. "
                "Appeler quand le technicien demande 'qu'est-ce que c'est', 'affiche la pièce', 'donne-moi le P/N', "
                "ou quand tu identifies un composant précis dans ton diagnostic. "
                "Le model_3d_id doit correspondre à un identifiant reconnu par le visualiseur frontend."
            ),
        ),
        StructuredTool.from_function(
            func=start_procedure_sequence,
            name="start_procedure_sequence",
            args_schema=StartProcedureSequenceInput,
            description=(
                "Lancer une procédure de maintenance pas à pas interactive. "
                "Appeler quand le technicien doit exécuter une séquence d'actions ordonnées "
                "(dépressurisation, remplacement pièce, test fonctionnel, etc.). "
                "Inclure toutes les étapes dès le départ. "
                "Les étapes type 'warning' s'affichent en rouge avant l'action dangereuse. "
                "Une fois lancée, utiliser advance_procedure_step à chaque confirmation du technicien."
            ),
        ),
        StructuredTool.from_function(
            func=advance_procedure_step,
            name="advance_procedure_step",
            args_schema=AdvanceProcedureStepInput,
            description=(
                "Passer à l'étape suivante d'une procédure interactive en cours. "
                "Appeler quand le technicien dit 'check', 'ok', 'suivant', 'étape suivante', 'c'est fait', "
                "ou toute confirmation que l'étape courante est terminée. "
                "Ne pas appeler si la procédure n'a pas été démarrée avec start_procedure_sequence."
            ),
        ),
        StructuredTool.from_function(
            func=end_procedure_sequence,
            name="end_procedure_sequence",
            args_schema=EndProcedureSequenceInput,
            description=(
                "Clôturer une procédure interactive. "
                "Appeler avec reason=completed quand toutes les étapes ont été confirmées. "
                "Appeler avec reason=aborted si le technicien demande d'arrêter ('stop', 'annule', 'on arrête'). "
                "Toujours clôturer avant de lancer une nouvelle procédure."
            ),
        ),
    ]
