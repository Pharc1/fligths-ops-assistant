import { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const C = {
  bg: '#080808',
  panel: 'rgba(255, 248, 232, 0.035)',
  panelStrong: 'rgba(255, 248, 232, 0.06)',
  line: 'rgba(230, 222, 202, 0.12)',
  lineStrong: 'rgba(230, 190, 92, 0.34)',
  text: 'rgba(238, 232, 216, 0.88)',
  textSoft: 'rgba(238, 232, 216, 0.62)',
  textDim: 'rgba(238, 232, 216, 0.38)',
  amber: 'rgba(232, 184, 74, 0.98)',
  amberSoft: 'rgba(232, 184, 74, 0.16)',
  danger: 'rgba(242, 121, 72, 0.82)',
}

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

      <div className="rime-document-layout">
        <main className="rime-document-reader">
          <div className="rime-reasoning-line">
            <span>RIME</span>
            <p>{entry.rimeNote ?? panel.payload?.reasoning ?? 'Passage retenu comme preuve documentaire.'}</p>
          </div>

          <article className="rime-excerpt">
            {entry.before && <p className="context">{entry.before}</p>}
            <p className="highlight">{entry.highlight ?? entry.excerpt ?? entry.text}</p>
            {entry.after && <p className="context">{entry.after}</p>}
          </article>
        </main>

        <aside className="rime-source-rail">
          <span className="rime-kicker">SOURCE</span>
          <h3>{source.label ?? source.title ?? source.id ?? 'Document source'}</h3>
          <div className="rime-source-token">{source.id ?? panel.payload?.sourceId ?? 'REF'}</div>
          <p>{formatSourceMeta(source)}</p>

          {entry.rimeAlert && (
            <div className="rime-alert">
              <span>ATTENTION</span>
              <p>{entry.rimeAlert}</p>
            </div>
          )}

          <button className="rime-outline-button" type="button" onClick={() => setModalOpen(true)}>
            <ExternalLink size={14} />
            OUVRIR DOCUMENT
          </button>
        </aside>
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
      <div className="rime-metric-hero">
        <div>
          <strong>{payload.value ?? '--'}</strong>
          <span>{payload.unit ?? ''}</span>
        </div>
        <p>Nominal: {payload.nominal ?? payload.limit ?? 'non fourni'}</p>
      </div>
      <Sparkline samples={payload.samples} large />
    </section>
  )
}

function HistoryPanel({ panel }) {
  const rows = panel.payload?.rows ?? panel.payload?.events ?? []
  return (
    <section className="rime-panel-main">
      <header className="rime-panel-header">
        <div>
          <span className="rime-kicker">HISTORIQUE</span>
          <h2>{panel.title}</h2>
        </div>
      </header>
      <div className="rime-history-list">
        {rows.map((row, index) => (
          <div className="rime-history-row" key={`${row.date ?? index}-${row.label ?? index}`}>
            <span>{row.date ?? row.timestamp ?? '--'}</span>
            <p>{row.label ?? row.description ?? row.text}</p>
            <b>{row.severity ?? row.status ?? 'LOG'}</b>
          </div>
        ))}
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
        {items.map((item, index) => (
          <div key={`${index}-${item.label ?? item}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{item.label ?? item.text ?? item}</p>
          </div>
        ))}
      </div>
    </section>
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
        <div className="rime-compact-list">
          {(payload.rows ?? payload.events ?? []).slice(0, 3).map((row, index) => (
            <p key={`${row.date ?? index}-${row.label ?? index}`}>
              <span>{row.date ?? '--'}</span>
              {row.label ?? row.description ?? row.text}
            </p>
          ))}
        </div>
      )}
      {panel.mode !== 'telemetry' && panel.mode !== 'history' && (
        <p className="rime-compact-text">{payload.text ?? payload.message ?? payload.reference ?? 'Voir detail.'}</p>
      )}
    </article>
  )
}

function DocumentModal({ entry, source, onClose }) {
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
        <pre>
          <span>{entry.before}</span>
          <mark>{entry.highlight ?? entry.excerpt ?? entry.text}</mark>
          <span>{entry.after}</span>
        </pre>
      </div>
    </div>
  )
}

function Sparkline({ samples = [], large = false }) {
  const values = samples.length ? samples : [0.45, 0.48, 0.46, 0.52, 0.5, 0.54]
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
      },
      highlight: entry.highlight ?? entry.excerpt ?? entry.text,
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
      },
      before: payload.before ?? '',
      highlight: payload.highlight ?? payload.excerpt ?? payload.text ?? panel.title,
      after: payload.after ?? '',
    },
  ]
}

function formatSourceMeta(source) {
  const page = source.page ? `p.${source.page}` : null
  return [page, source.date].filter(Boolean).join(' / ') || 'metadata source non fournie'
}
