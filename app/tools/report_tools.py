"""
Report tool — génère le rapport technique final structuré pour le technicien.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field


class WriteReportInput(BaseModel):
    system: str = Field(description="Système concerné (ex: Hydraulique ATA 29, Train d'atterrissage ATA 32)")
    diagnosis: str = Field(description="Diagnostic : cause probable identifiée")
    actions: list[str] = Field(description="Actions correctives recommandées, dans l'ordre d'exécution")
    confidence: float = Field(description="Niveau de confiance du diagnostic entre 0.0 et 1.0")
    references: list[str] = Field(default_factory=list, description="Sources documentaires utilisées")
    escalation_required: bool = Field(default=False, description="True si une escalade bureau technique est nécessaire")


def build_report_tools() -> list[StructuredTool]:

    def write_report(
        system: str,
        diagnosis: str,
        actions: list[str],
        confidence: float,
        references: list[str],
        escalation_required: bool,
    ) -> str:
        actions_fmt = "\n".join(f"  {i + 1}. {a}" for i, a in enumerate(actions))
        refs_fmt = "\n".join(f"  - {r}" for r in references) if references else "  - Aucune référence explicite"
        escalation_note = "\n⚠️  ESCALADE REQUISE — Contacter le bureau technique avant intervention." if escalation_required else ""

        return f"""
=== RAPPORT TECHNIQUE ===
Système       : {system}
Diagnostic    : {diagnosis}
Confiance     : {int(confidence * 100)}%

Actions recommandées :
{actions_fmt}

Références :
{refs_fmt}
{escalation_note}
=========================
""".strip()

    return [
        StructuredTool.from_function(
            func=write_report,
            name="write_report",
            args_schema=WriteReportInput,
            description=(
                "Rédiger le rapport technique final structuré. Appeler en dernière étape, "
                "une fois que toutes les recherches sont terminées et les tâches complétées."
            ),
        ),
    ]
