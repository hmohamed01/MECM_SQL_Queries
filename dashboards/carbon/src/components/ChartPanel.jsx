import { useMemo } from 'react'
import { SkeletonPlaceholder, Tile, Toggletip, ToggletipButton, ToggletipContent, useTheme } from '@carbon/react'
import { Information, Search } from '@carbon/icons-react'
import { useQuery } from '../lib/api.js'
import { formatNumber } from '../lib/aggregate.js'
import { CHARTS } from './charts.js'
import { QueryNotice } from './QueryNotice.jsx'
import { StatusIndicator } from './StatusIndicator.jsx'

const PanelAbout = ({ queryMeta, chart, rationale }) => (
  <Toggletip align="bottom-left" autoAlign>
    <ToggletipButton label="About this visualization">
      <Information />
    </ToggletipButton>
    <ToggletipContent>
      <div className="panel-about">
        <p className="panel-about__label">Why a {chart.name.toLowerCase()}</p>
        <p>{rationale}</p>
        {queryMeta && (
          <>
            <p className="panel-about__label">{queryMeta.title}</p>
            <p>{queryMeta.description}</p>
            <p className="panel-about__views">{queryMeta.views.join(' · ')}</p>
          </>
        )}
      </div>
    </ToggletipContent>
  </Toggletip>
)

export const PanelFooter = ({ queryId, result }) => (
  <footer className="panel-footer">
    <code className="panel-footer__file">{queryId}.sql</code>
    {result && (
      <span className="panel-footer__meta">
        <span className={`source-dot source-dot--${result.source}`} aria-hidden="true" />
        {formatNumber(result.rowCount)} rows · {result.durationMs} ms
        {result.truncated && ' · truncated'}
      </span>
    )}
  </footer>
)

const NO_TRUNCATION = { type: 'none' }

// Keeps a fixed label→color scale from listing groups this result does not contain (Carbon Charts warns on those).
const scaleForPresentGroups = (color, data) => {
  if (!color?.scale) return color
  const presentGroups = new Set(data.map((datum) => datum.group ?? datum.name))
  return { ...color, scale: Object.fromEntries(Object.entries(color.scale).filter(([group]) => presentGroups.has(group))) }
}

const PanelBody = ({ state, built, chart, height, panel, paramMissing }) => {
  if (paramMissing) {
    return (
      <div className="panel-empty" style={{ minHeight: height }}>
        <Search size={24} />
        <p>{panel.paramPrompt}</p>
      </div>
    )
  }
  if (state.status === 'error') return <QueryNotice error={state.error} />
  if (state.status !== 'success') return <SkeletonPlaceholder className="panel-skeleton" style={{ height }} />
  if (!built || built.data.length === 0) {
    return (
      <div className="panel-empty" style={{ minHeight: height }}>
        <StatusIndicator label={panel.emptyText ?? 'No rows returned'} kind={panel.emptyKind ?? 'normal'} />
      </div>
    )
  }
  const Chart = chart.component
  return <Chart data={built.data} options={built.options} />
}

export const ChartPanel = ({ panel, params, index }) => {
  const { theme } = useTheme()
  const chart = CHARTS[panel.chart]
  const height = panel.height ?? '320px'
  const paramValue = panel.param ? params[panel.param] : undefined
  const paramMissing = Boolean(panel.param) && !paramValue
  const state = useQuery(panel.query, panel.param ? { [panel.param]: paramValue } : undefined, { enabled: !paramMissing })

  const built = useMemo(() => {
    if (state.status !== 'success') return null
    const output = panel.build(state.result.rows, { theme })
    return output && {
      data: output.data,
      options: {
        theme,
        height,
        resizable: true,
        toolbar: { enabled: true, numberOfIcons: 2 },
        accessibility: { svgAriaLabel: panel.title },
        ...output.options,
        legend: { alignment: 'left', truncation: NO_TRUNCATION, ...output.options?.legend },
        color: scaleForPresentGroups(output.options?.color, output.data),
      },
    }
  }, [state, panel, theme, height])

  const queryMeta = state.result?.query ?? state.error?.query
  const hasChartToolbar = Boolean(built?.data.length) && built.options.toolbar?.enabled !== false
  return (
    <Tile className="chart-panel" style={{ '--stagger': index }}>
      <header className="chart-panel__header">
        <p className="chart-panel__eyebrow">
          {chart.purpose} <span aria-hidden="true">/</span> {chart.name}
        </p>
        <div className="chart-panel__title-row">
          <h3 className="chart-panel__title">{panel.title}</h3>
          <PanelAbout queryMeta={queryMeta} chart={chart} rationale={panel.rationale} />
        </div>
      </header>
      <div className={`chart-panel__body${hasChartToolbar ? ' chart-panel__body--with-toolbar' : ''}`}>
        <PanelBody state={state} built={built} chart={chart} height={height} panel={panel} paramMissing={paramMissing} />
      </div>
      <PanelFooter queryId={panel.query} result={state.result} />
    </Tile>
  )
}
