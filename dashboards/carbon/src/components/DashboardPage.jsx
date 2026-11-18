import { useState } from 'react'
import { Button, Column, Grid, Search } from '@carbon/react'
import { ChartPanel } from './ChartPanel.jsx'
import { KpiTile } from './KpiTile.jsx'
import { RecordsSection } from './RecordsSection.jsx'

const PageHeader = ({ dashboard, position, total }) => {
  const queryFiles = [
    ...new Set([...(dashboard.kpis ?? []), ...dashboard.panels, ...(dashboard.records ?? [])].map(({ query }) => query)),
  ]
  return (
    <header className="page-header">
      <p className="page-header__eyebrow">
        {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')} — {dashboard.eyebrow}
      </p>
      <h1 className="page-header__title">{dashboard.title}</h1>
      <p className="page-header__summary">{dashboard.summary}</p>
      <ul className="page-header__queries" aria-label="SQL files used on this dashboard">
        {queryFiles.map((queryId) => (
          <li key={queryId}>
            <code>{queryId.split('/')[1]}.sql</code>
          </li>
        ))}
      </ul>
    </header>
  )
}

const ParamBar = ({ param, value, onSubmit }) => {
  const [draft, setDraft] = useState(value ?? '')
  return (
    <form
      className="param-bar"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(draft.trim())
      }}
    >
      <Search
        size="lg"
        labelText={param.label}
        placeholder={param.placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onClear={() => {
          setDraft('')
          onSubmit('')
        }}
      />
      <Button type="submit" size="lg">
        Run query
      </Button>
    </form>
  )
}

const PanelGrid = ({ panels, params, offset = 0 }) => (
  <Grid className="panel-grid" narrow>
    {panels.map((panel, index) => (
      <Column key={`${panel.query}:${panel.title}`} sm={4} md={8} lg={panel.span ?? 8} className="panel-grid__cell">
        <ChartPanel panel={panel} params={params} index={offset + index} />
      </Column>
    ))}
  </Grid>
)

export const DashboardPage = ({ dashboard, position, total }) => {
  const [params, setParams] = useState({})
  const kpis = dashboard.kpis ?? []
  const fixedPanels = dashboard.panels.filter((panel) => !panel.param)

  return (
    <div className="dashboard">
      <PageHeader dashboard={dashboard} position={position} total={total} />

      {kpis.length > 0 && (
        <Grid className="kpi-grid" narrow>
          {kpis.map((kpi, index) => (
            <Column key={kpi.label} sm={2} md={4} lg={kpi.span ?? 4}>
              <KpiTile kpi={kpi} index={index} href={kpi.href} />
            </Column>
          ))}
        </Grid>
      )}

      <PanelGrid panels={fixedPanels} params={params} offset={kpis.length} />

      {(dashboard.params ?? []).map((param) => (
        <section key={param.name} className="lookup" aria-label={param.title}>
          <h2 className="section-heading">{param.title}</h2>
          <p className="lookup__description">{param.description}</p>
          <ParamBar param={param} value={params[param.name]} onSubmit={(value) => setParams((current) => ({ ...current, [param.name]: value }))} />
          <PanelGrid panels={dashboard.panels.filter((panel) => panel.param === param.name)} params={params} />
        </section>
      ))}

      {dashboard.records?.length > 0 && <RecordsSection records={dashboard.records} params={params} />}
    </div>
  )
}
