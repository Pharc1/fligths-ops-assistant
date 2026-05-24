export const INVESTIGATION_MOCK_PANELS = [
  {
    mode: 'document',
    title: 'BEA-2012-04 / OBSTRUCTION PITOT',
    priority: 'primary',
    payload: {
      confidence: 0.91,
      timestamp: '03:14:22 UTC',
      recommendation:
        'Priorite: verifier le circuit de chauffage Pitot et confronter la chronologie ADR/ACARS avant de conclure a une obstruction.',
      entries: [
        {
          rimeNote: "Je relie votre signal Pitot a un cas documente : obstruction simultanee, perte de reference vitesse, puis degradation de loi. Ce passage est la preuve qui justifie la piste.",
          rimeAlert: 'Verifier le statut SB chauffage sondes avant toute conclusion.',
          source: {
            id: 'BEA-2012-04',
            label: 'RAPPORT FINAL BEA',
            date: '2012-07-29',
            page: 42,
            url: 'https://bea.aero/fileadmin/documents/docspa/2009/f-cp090601/pdf/f-cp090601.pdf',
          },
          before: "3.1 DEFAILLANCE DES SONDES PITOT\n\nLes investigations ont etabli que les trois sondes de vitesse se sont obstruees simultanement par des cristaux de glace.\n\n",
          highlight: "Les trois sondes de vitesse se sont obstruees simultanement, privant l'equipage de l'indication de vitesse air pendant 54 secondes consecutives.",
          after: "\n\nLe pilote automatique s'est deconnecte et la loi de pilotage a regresse en loi alternante.",
        },
        {
          rimeNote: "La chronologie ACARS donne la sequence systeme. Elle permet de comparer votre incident a une signature connue, sans transformer la source en diagnostic definitif.",
          rimeAlert: null,
          source: {
            id: 'ACARS-AF447',
            label: 'MESSAGES ACARS',
            date: '2009-06-01',
            page: 1,
            url: 'https://bea.aero/fileadmin/documents/docspa/2009/f-cp090601/pdf/f-cp090601.pdf',
          },
          before: 'AIRBUS A330 - MESSAGES ACARS\nSequence enregistree entre 02h10 et 02h14 UTC\n\n02h10:34 - AUTO FLT AP OFF\n02h10:51 - F/CTL ALTN LAW\n\n',
          highlight: 'AUTO FLT AP OFF - F/CTL ALTN LAW - STALL WARNING. Sequence de 28 messages en 3 minutes.',
          after: '\n\nCette sequence est utile pour verifier la coherence temporelle des evenements.',
        },
      ],
    },
  },
  {
    mode: 'telemetry',
    title: 'PRESSION HYD. BLEU',
    priority: 'secondary',
    payload: {
      value: '2870',
      unit: 'PSI',
      nominal: '3000 +/-200',
      trend: 'stable',
      samples: [0.72, 0.74, 0.71, 0.75, 0.73, 0.76, 0.74, 0.75],
    },
  },
  {
    mode: 'history',
    title: 'HISTORIQUE F-GZCP',
    priority: 'secondary',
    payload: {
      rows: [
        { date: '2026-05-14', label: 'Pitot ADR disagree', severity: 'MED' },
        { date: '2026-04-02', label: 'Probe heat relay replaced', severity: 'LOW' },
        { date: '2025-12-19', label: 'Intermittent air data fault', severity: 'MED' },
      ],
    },
  },
]
