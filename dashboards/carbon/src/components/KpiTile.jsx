import { ClickableTile, SkeletonText, Tile, useTheme } from '@carbon/react'
import { useQuery } from '../lib/api.js'
import { formatNumber } from '../lib/aggregate.js'
import { statusColor } from '../lib/status.js'
import { StatusIndicator } from './StatusIndicator.jsx'

const formatMetric = ({ value, format }) => (format === 'percent' ? formatNumber(value, 1) : formatNumber(value))

export const KpiTile = ({ kpi, index, href }) => {
  const { theme } = useTheme()
  const state = useQuery(kpi.query)
  const metric = state.status === 'success' ? kpi.compute(state.result.rows) : null
  const TileComponent = href ? ClickableTile : Tile
  const accent = metric?.kind ? statusColor(metric.kind, theme) : 'var(--cds-border-subtle-01)'

  return (
    <TileComponent href={href} className="kpi-tile" style={{ '--stagger': index, '--kpi-accent': accent }}>
      <p className="kpi-tile__label">{kpi.label}</p>
      {state.status === 'error' && <p className="kpi-tile__error">Query failed</p>}
      {state.status !== 'error' && !metric && <SkeletonText heading width="60%" />}
      {metric && (
        <>
          <p className="kpi-tile__value">
            {formatMetric(metric)}
            {metric.format === 'percent' && <span className="kpi-tile__unit">%</span>}
          </p>
          <div className="kpi-tile__detail">
            {metric.kind ? <StatusIndicator label={metric.detail} kind={metric.kind} /> : metric.detail}
          </div>
        </>
      )}
      <code className="kpi-tile__source">{kpi.query.split('/')[1]}</code>
    </TileComponent>
  )
}
