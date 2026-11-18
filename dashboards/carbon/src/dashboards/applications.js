import { Apps } from '@carbon/icons-react'
import { countBy, truncateLabel } from '../lib/aggregate.js'
import { statusScale } from '../lib/status.js'
import { categoricalScale, horizontalBar, percentGauge, stackedBar, statusStackedBar } from './chartBuilders.js'

const APP_PROMPT = 'Search for an application to see the enforcement state on every targeted device.'
const DEPLOYMENT_STATES = { Success: 'succeeded', 'In Progress': 'in-progress', Errors: 'failed', Unknown: 'unknown' }
const LIFECYCLE_STATES = ['Deployed', 'Not deployed', 'Retired']

const lifecycleOf = (row) => (!Number(row['Is Enabled']) ? 'Retired' : Number(row['Is Deployed']) ? 'Deployed' : 'Not deployed')

export const deploymentSuccessGauge = {
  query: 'Applications/Deployment_Summary',
  title: 'Overall deployment success',
  chart: 'gauge',
  span: 5,
  height: '280px',
  rationale:
    'Deployment_Summary.sql returns a single success rate. A gauge reads one bounded value best, and its status color warns before the rate drops below target.',
  build: ([summary], { theme }) => (summary ? percentGauge({ percent: summary['Overall Success Rate %'] ?? 0, theme }) : null),
}

export const applications = {
  id: 'applications',
  navLabel: 'Applications',
  icon: Apps,
  eyebrow: 'Applications',
  title: 'Application deployments',
  summary: 'Deployment success per application and collection, the most common failure reasons, and the state of the application catalog.',
  panels: [
    deploymentSuccessGauge,
    {
      query: 'Applications/Application_Deployment_Status',
      title: 'Enforcement state per deployment',
      chart: 'stackedBar',
      span: 11,
      height: '420px',
      rationale:
        'Each deployment\'s targets split into success, in progress, errors and unknown. Stacked bars compare deployments by size and by health at the same time, in status colors.',
      build: (rows, { theme }) => {
        const nameCounts = countBy(rows, (row) => row['Application Name'])
        const labelOf = (row) =>
          truncateLabel(nameCounts.get(row['Application Name']) > 1 ? `${row['Application Name']} → ${row['Target Collection']}` : row['Application Name'], 40)
        const ordered = rows.toSorted((left, right) => right['Total Targeted'] - left['Total Targeted'])
        return statusStackedBar({
          data: Object.keys(DEPLOYMENT_STATES).flatMap((state) => ordered.map((row) => ({ group: state, key: labelOf(row), value: row[state] ?? 0 }))),
          valueTitle: 'Targeted devices',
          labelDomain: ordered.map(labelOf),
          theme,
          overrides: DEPLOYMENT_STATES,
        })
      },
    },
    {
      query: 'Applications/Failed_Deployments',
      title: 'Failures by application and cause',
      chart: 'stackedBar',
      span: 8,
      height: '340px',
      rationale:
        'Failure causes are nominal categories, not severity levels, so they take Carbon\'s categorical palette. Stacking cause per application shows whether a package fails one way (bad content) or many (environment).',
      emptyText: 'No failed application installs',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const causes = [...countBy(rows, (row) => row['Error Description'])].sort(([, left], [, right]) => right - left).map(([cause]) => cause)
        const applicationTotals = [...countBy(rows, (row) => row['Application Name'])].sort(([, left], [, right]) => right - left)
        const counts = countBy(rows, (row) => `${row['Application Name']}|${row['Error Description']}`)
        return stackedBar({
          data: causes.flatMap((cause) =>
            applicationTotals.map(([application]) => ({ group: cause, key: application, value: counts.get(`${application}|${cause}`) ?? 0 })),
          ).filter(({ value }) => value > 0),
          valueTitle: 'Failed devices',
          labelDomain: applicationTotals.map(([application]) => application),
          colorScale: categoricalScale(causes, theme),
        })
      },
    },
    {
      query: 'Applications/Application_List',
      title: 'Catalog by year created',
      chart: 'stackedBar',
      span: 8,
      height: '340px',
      rationale:
        'Grouping the catalog by creation year, stacked by lifecycle state, shows where clutter piles up. Old applications that were never deployed or are already retired are candidates for cleanup.',
      build: (rows, { theme }) => {
        const yearOf = (row) => String(row['Created Date'] ?? '').slice(0, 4) || 'Unknown'
        const years = [...new Set(rows.map(yearOf))].sort()
        const counts = countBy(rows, (row) => `${yearOf(row)}|${lifecycleOf(row)}`)
        return stackedBar({
          data: LIFECYCLE_STATES.flatMap((state) => years.map((year) => ({ group: state, key: year, value: counts.get(`${year}|${state}`) ?? 0 }))),
          valueTitle: 'Applications',
          orientation: 'vertical',
          labelDomain: years,
          colorScale: categoricalScale(LIFECYCLE_STATES, theme),
        })
      },
    },
    {
      query: 'Applications/Application_Install_Status_By_Device',
      param: 'AppName',
      paramPrompt: APP_PROMPT,
      title: 'Enforcement states for matching applications',
      chart: 'bar',
      span: 16,
      height: '340px',
      rationale:
        'There are 13 possible enforcement states, too many for a donut, so they run as ranked horizontal bars. Each bar uses its status color, so success, waiting, pending reboot and failure read differently at a glance.',
      emptyText: 'No deployments match this search',
      emptyKind: 'unknown',
      build: (rows, { theme }) => {
        const states = [...countBy(rows, (row) => row['Enforcement State'])].sort(([, left], [, right]) => right - left)
        return horizontalBar({
          data: states.map(([state, count]) => ({ group: state, key: state, value: count })),
          valueTitle: 'Devices',
          labelDomain: states.map(([state]) => state),
          colorScale: statusScale(states.map(([state]) => state), theme),
        })
      },
    },
  ],
  params: [
    {
      name: 'AppName',
      title: 'Application lookup',
      description: 'Runs Application_Install_Status_By_Device.sql. The search is wrapped in % wildcards automatically.',
      label: 'Application name',
      placeholder: 'e.g. Acrobat, Expense, Secure Client',
    },
  ],
  records: [
    {
      query: 'Applications/Failed_Deployments',
      tab: 'Failures',
      title: 'Failed deployments',
      description: 'Devices where an application install ended in an error state.',
      emphasis: true,
    },
    {
      query: 'Applications/Application_Deployment_Status',
      tab: 'Deployments',
      title: 'Application deployment status',
      description: 'Success, in-progress, error and unknown counts per application deployment.',
    },
    {
      query: 'Applications/Application_Install_Status_By_Device',
      param: 'AppName',
      paramPrompt: APP_PROMPT,
      tab: 'Per device',
      title: 'Install status by device',
      description: 'Enforcement state on each device for the application lookup.',
      statusColumns: { 'Install Status': {}, 'Enforcement State': {} },
    },
    {
      query: 'Applications/Application_List',
      tab: 'Catalog',
      title: 'Application list',
      description: 'Every application in the catalog with its deployment and enablement flags.',
    },
    {
      query: 'Applications/Deployment_Summary',
      tab: 'Summary',
      title: 'Deployment summary',
      description: 'Totals across all application deployments.',
    },
  ],
}
