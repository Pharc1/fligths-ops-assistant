def test_legacy_analysis_service_imports_without_side_effects():
    from app.services.analysis_service import AnalysisService

    assert AnalysisService is not None
