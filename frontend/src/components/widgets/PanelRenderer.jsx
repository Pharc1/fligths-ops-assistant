import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PanelRenderer({ panel, compact = false }) {
  if (!panel) return null

  if (compact) {
    return <CompactPanel panel={panel} />
  }

  switch (panel.mode) {
    case 'document':
      return <DocumentPanel panel={panel} />
    case 'telemetry':
      return <TelemetryPanel panel={panel} />
    case 'history':
      return <HistoryPanel panel={panel} />
    case 'part':
      return <PartPanel panel={panel} />
    case 'checklist':
      return <ChecklistPanel panel={panel} />
    default:
      return <NoticePanel panel={panel} />
  }
}

function DocumentPanel({ panel }) {
  const entries = getDocumentEntries(panel)
  const [index, setIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  const entry = entries[Math.min(index, entries.length - 1)]
  if (!entry) return <NoticePanel panel={panel} />

  const source = entry.source ?? {}
  const confidence = panel.payload?.confidence
  const confLabel = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : null
  const guidance = panel.payload?.guidance ?? entries[index]?.guidance ?? null
  const note = guidance ?? panel.payload?.recommendation ?? entries[index]?.recommendation ?? null
  const noteLabel = panel.payload?.noteLabel ?? (guidance ? 'LECTURE RIME' : 'POINT D ATTENTION')

  return (
    <section className="rime-panel-main rime-document-panel">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">PREUVE GUIDEE</span>
          <h2>{panel.title}</h2>
        </div>
        <div className="rime-header-meta">
          {confLabel && <span>CONF. {confLabel}</span>}
          <span>{index + 1} / {entries.length}</span>
        </div>
      </header>

      <div className={`rime-document-body ${note ? 'has-note' : 'no-note'}`}>
        {note && (
          <div className="rime-recommendation-block">
            <span>{noteLabel}</span>
            <p>{note}</p>
          </div>
        )}

        <article className="rime-excerpt">
          {entry.before && <p className="context">{entry.before}</p>}
          {entry.text && <p className="context source-text">{entry.text}</p>}
          {entry.highlight && (
            <p className="highlight">
              <span>PASSAGE CLE</span>
              {entry.highlight}
            </p>
          )}
          {entry.after && <p className="context">{entry.after}</p>}
        </article>

        <div className="rime-document-tools">
          <div className="rime-source-strip" aria-label="Sources documentaires">
            {entries.map((item, entryIndex) => {
              const itemSource = item.source ?? {}
              const isActive = entryIndex === index
              return (
                <button
                  key={`${itemSource.id ?? itemSource.label ?? 'source'}-${entryIndex}`}
                  type="button"
                  className={`rime-source-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setIndex(entryIndex)}
                >
                  <span>{itemSource.id ?? panel.payload?.sourceId ?? 'REF'}</span>
                  <b>{itemSource.label ?? itemSource.title ?? itemSource.id ?? 'Source documentaire'}</b>
                  <small>{formatSourceMeta(itemSource)}</small>
                </button>
              )
            })}
          </div>

          <div className="rime-doc-actions">
            <button type="button" className="rime-inline-action" onClick={() => setModalOpen(true)}>
              APERCU DOCUMENT
            </button>
            {source.url && (
              <a href={source.url} target="_blank" rel="noreferrer" className="rime-inline-action">
                LIRE SOURCE
              </a>
            )}
          </div>

          {entry.rimeAlert && (
            <div className="rime-alert">
              <span>ATTENTION</span>
              <p>{entry.rimeAlert}</p>
            </div>
          )}
        </div>
      </div>

      <footer className="rime-panel-footer">
        <button type="button" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          <ChevronLeft size={18} />
        </button>
        <div className="rime-progress-track">
          <span style={{ width: `${((index + 1) / entries.length) * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={() => setIndex(Math.min(entries.length - 1, index + 1))}
          disabled={index === entries.length - 1}
        >
          <ChevronRight size={18} />
        </button>
        <span>{panel.payload?.timestamp ?? 'LIVE'}</span>
      </footer>

      {modalOpen && <DocumentModal entry={entry} source={source} onClose={() => setModalOpen(false)} />}
    </section>
  )
}

function TelemetryPanel({ panel }) {
  const payload = panel.payload ?? {}
  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">TELEMETRIE</span>
          <h2>{panel.title}</h2>
        </div>
        <span className="rime-state-chip">{payload.trend ?? 'live'}</span>
      </header>
      <div className="rime-telemetry-body">
        <div className="rime-metric-hero">
          <div>
            <strong>{payload.value ?? '--'}</strong>
            <span>{payload.unit ?? ''}</span>
          </div>
          <p>Nominal: {payload.nominal ?? payload.limit ?? 'non fourni'}</p>
        </div>
        <Sparkline samples={payload.samples} large />
      </div>
    </section>
  )
}

function HistoryPanel({ panel }) {
  const rows = panel.payload?.rows ?? panel.payload?.events ?? []
  const series = getSeries(panel.payload, rows)
  const latest = series[series.length - 1]

  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">{series.length > 1 ? 'SERIE HISTORIQUE' : 'HISTORIQUE'}</span>
          <h2>{panel.title}</h2>
        </div>
      </header>
      {series.length > 1 && (
        <div className="rime-history-chart">
          <div className="rime-history-chart-head">
            <span>DERNIERE VALEUR</span>
            <strong>{formatSeriesPoint(latest)}</strong>
          </div>
          <Sparkline samples={series.map((point) => point.value)} large />
          <div className="rime-history-chart-axis">
            <span>{series[0]?.date ?? '--'}</span>
            <span>{latest?.date ?? '--'}</span>
          </div>
        </div>
      )}
      <div className="rime-history-list">
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <div className="rime-history-row" key={`${row.date ?? index}-${row.label ?? index}`}>
              <span>{row.date ?? row.timestamp ?? '--'}</span>
              <p>{row.label ?? row.description ?? row.text ?? 'Evenement historique'}</p>
              {formatMeasurement(row) && <strong className="rime-history-value">{formatMeasurement(row)}</strong>}
              {(row.severity ?? row.status) && <b>{row.severity ?? row.status}</b>}
            </div>
          ))
        ) : (
          <PanelEmptyState label="AUCUNE LIGNE" text="Le panel historique est ouvert, mais aucune ligne exploitable n'a ete fournie." />
        )}
      </div>
    </section>
  )
}

function PartPanel({ panel }) {
  const payload = panel.payload ?? {}
  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">PIECE</span>
          <h2>{panel.title}</h2>
        </div>
      </header>
      <div className="rime-part-grid">
        <InfoCell label="REF" value={payload.reference ?? payload.partNumber ?? '--'} />
        <InfoCell label="ATA" value={payload.ata ?? '--'} />
        <InfoCell label="STOCK" value={payload.stock ?? payload.availability ?? '--'} />
        <InfoCell label="ETAT" value={payload.status ?? '--'} />
      </div>
    </section>
  )
}

function ChecklistPanel({ panel }) {
  const items = panel.payload?.items ?? panel.payload?.steps ?? []
  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">CHECKLIST</span>
          <h2>{panel.title}</h2>
        </div>
      </header>
      <div className="rime-check-list">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${index}-${item.label ?? item}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item.label ?? item.text ?? item}</p>
            </div>
          ))
        ) : (
          <PanelEmptyState label="SEQUENCE VIDE" text="Aucune etape exploitable n'a ete fournie pour cette procedure." />
        )}
      </div>
    </section>
  )
}

function PanelEmptyState({ label, text }) {
  return (
    <div className="rime-panel-empty-state">
      <span>{label}</span>
      <p>{text}</p>
    </div>
  )
}

function NoticePanel({ panel }) {
  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">NOTE RIME</span>
          <h2>{panel.title}</h2>
        </div>
      </header>
      <div className="rime-notice">
        {panel.payload?.text ?? panel.payload?.message ?? 'Information complementaire affichee par RIME.'}
      </div>
    </section>
  )
}

function CompactPanel({ panel }) {
  const payload = panel.payload ?? {}
  const historySeries = panel.mode === 'history' ? getSeries(payload, payload.rows ?? payload.events ?? []) : []
  return (
    <article className={`rime-compact-card mode-${panel.mode}`}>
      <div className="rime-compact-head">
        <span>{panel.mode}</span>
        <b>{panel.title}</b>
      </div>
      {panel.mode === 'telemetry' && (
        <>
          <div className="rime-compact-metric">
            <strong>{payload.value ?? '--'}</strong>
            <span>{payload.unit ?? ''}</span>
          </div>
          <Sparkline samples={payload.samples} />
        </>
      )}
      {panel.mode === 'history' && (
        historySeries.length > 1 ? (
          <>
            <div className="rime-compact-metric">
              <strong>{formatSeriesPoint(historySeries[historySeries.length - 1])}</strong>
            </div>
            <Sparkline samples={historySeries.map((point) => point.value)} />
          </>
        ) : (
          <div className="rime-compact-list">
            {(payload.rows ?? payload.events ?? []).slice(0, 3).map((row, index) => (
              <p key={`${row.date ?? index}-${row.label ?? index}`}>
                <span>{row.date ?? '--'}</span>
                {row.label ?? row.description ?? row.text}
              </p>
            ))}
          </div>
        )
      )}
      {panel.mode !== 'telemetry' && panel.mode !== 'history' && (
        <p className="rime-compact-text">{payload.text ?? payload.message ?? payload.reference ?? 'Voir detail.'}</p>
      )}
    </article>
  )
}

function DocumentModal({ entry, source, onClose }) {
  const previewText = [entry.before, entry.highlight ?? entry.excerpt ?? entry.text, entry.after]
    .filter(Boolean)
    .join('\n')
  return (
    <div className="rime-doc-modal" role="presentation" onClick={onClose}>
      <div className="rime-doc-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>{source.id ?? 'DOCUMENT'}</span>
            <h3>{source.label ?? source.title ?? 'Source documentaire'}</h3>
          </div>
          <button type="button" onClick={onClose}>FERMER</button>
        </header>
        {source.url && (
          <div className="rime-doc-modal-link">
            <a href={source.url} target="_blank" rel="noreferrer">
              Ouvrir le document original dans un nouvel onglet
            </a>
          </div>
        )}
        <pre>
          <span>{previewText}</span>
        </pre>
      </div>
    </div>
  )
}

function Sparkline({ samples = [], large = false }) {
  const values = normalizeSparkValues(samples.length ? samples : [0.45, 0.48, 0.46, 0.52, 0.5, 0.54])
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100
      const y = 44 - Number(value) * 34
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className={large ? 'rime-sparkline large' : 'rime-sparkline'} viewBox="0 0 100 48" preserveAspectRatio="none">
      <polyline points={points} />
    </svg>
  )
}

function InfoCell({ label, value }) {
  return (
    <div className="rime-info-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getDocumentEntries(panel) {
  const payload = panel.payload ?? {}
  const rawEntries = payload.entries ?? payload.citations ?? payload.sources ?? []
  if (rawEntries.length > 0) {
    return rawEntries.map((entry) => ({
      ...entry,
      source: entry.source ?? {
        id: entry.sourceId ?? entry.id,
        label: entry.label ?? entry.title,
        page: entry.page,
        date: entry.date,
        startIndex: entry.startIndex ?? entry.start_index,
        section: entry.section,
        ata: entry.ata,
      },
      text: entry.text ?? entry.snippet ?? (entry.highlight ? entry.excerpt : null),
      highlight: entry.highlight ?? entry.value ?? entry.limit ?? entry.threshold ?? entry.keyValue ?? null,
    }))
  }

  return [
    {
      rimeNote: payload.reasoning ?? payload.note,
      rimeAlert: payload.alert,
      source: {
        id: payload.sourceId,
        label: payload.sourceLabel ?? payload.document,
        page: payload.page,
        date: payload.date,
        startIndex: payload.startIndex ?? payload.start_index,
        section: payload.section,
        ata: payload.ata,
      },
      before: payload.before ?? '',
      text: payload.text ?? payload.snippet ?? payload.excerpt ?? '',
      highlight: payload.highlight ?? payload.value ?? payload.limit ?? payload.threshold ?? payload.keyValue ?? null,
      after: payload.after ?? '',
    },
  ]
}

function normalizeSparkValues(samples) {
  const numeric = samples
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
  if (numeric.length === 0) return [0.5]
  if (numeric.every((value) => value >= 0 && value <= 1)) return numeric
  const min = Math.min(...numeric)
  const max = Math.max(...numeric)
  if (min === max) return numeric.map(() => 0.5)
  return numeric.map((value) => 0.12 + ((value - min) / (max - min)) * 0.76)
}

function getSeries(payload = {}, rows = []) {
  const series = payload.series ?? payload.samplesWithDates
  if (Array.isArray(series) && series.length > 0) return series

  return rows
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
    .map((row) => ({
      date: row.date ?? row.timestamp ?? '--',
      value: row.value,
      unit: row.unit ?? payload.unit ?? '',
    }))
}

function formatSeriesPoint(point) {
  if (!point) return '--'
  return `${point.value ?? '--'}${point.unit ? ` ${point.unit}` : ''}`
}

function formatMeasurement(row) {
  if (row.value === undefined || row.value === null || row.value === '') return ''
  return `${row.value}${row.unit ? ` ${row.unit}` : ''}`
}

function formatSourceMeta(source) {
  const page = source.page ? `p.${source.page}` : null
  const startIndex = source.startIndex ? `idx ${source.startIndex}` : null
  return [page, source.date, source.ata, source.section, startIndex].filter(Boolean).join(' / ') || 'source locale'
}
