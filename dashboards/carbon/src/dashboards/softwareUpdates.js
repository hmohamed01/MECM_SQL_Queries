import { UpdateNow } from '@carbon/icons-react'
import { countBy, groupRows, truncateLabel } from '../lib/aggregate.js'
import { statusScale } from '../lib/status.js'
import { donut, horizontalBar, statusStackedBar } from './chartBuilders.js'

const SEVERITIES = ['Critical', 'Important', 'Moderate', 'Low', 'Unspecified']
const COMPLIANCE_TARGET = 95

const shortUpdateTitle = (title) =>
  title.replace(/ for x64-based (Systems|Editions)/, '').replace(/\s*\(KB\d+\)/, '').replace(/^Microsoft server operating system/, 'Server')

export const complianceBulletPanel = {
  query: 'Software-Updates/Update_Compliance_Summary',
  title: 'Compliance by classification',
  chart: 'bullet',
  span: 8,
  height: '320px',
  rationale:
    'A bullet chart shows actual compliance against a target, with qualitative bands behind it, all in one row per classification. The marker sits at the 95% patch target, so shortfalls read at a glance.',
  build: (rows) => ({
    data: rows.map((row) => ({
      title: row.Classification,
      group: 'Compliance %',
      ranges: [85, COMPLIANCE_TARGET, 100],
      marker: COMPLIANCE_TARGET,
      value: row['Compliance %'] ?? 0,
    })),
    options: {
      axes: {
        bottom: { mapsTo: 'value', title: 'Installed ÷ applicable (%)', extendLinearDomainBy: 'marker' },
        left: { mapsTo: 'title', scaleType: 'labels', truncation: { type: 'none' } },
      },
      bullet: { performanceAreaTitles: ['Below 85%', '85–95%', 'At target'] },
    },
  }),
}

export const softwareUpdates = {
  id: 'software-updates',
  navLabel: 'Software updates',
  icon: UpdateNow,
  eyebrow: 'Software-Updates',
  title: 'Software updates',
  summary: 'Patch compliance by classification and update group, the devices furthest behind, and whether scans are completing.',
  panels: [
    complianceBulletPanel,
    {
      query: 'Software-Updates/Update_Deployment_Status',
      title: 'Update group deployment state',
      chart: 'stackedBar',
      span: 8,
      height: '320px',
      rationale:
        'Each update group is a whole split into compliant, required and not-required devices. Stacked bars keep the groups comparable while the status colors flag the required share.',
      build: (rows, { theme }) => {
        const states = [['Compliant', 'Compliant'], ['Required', 'Required'], ['Not Required', 'Not Required']]
        return statusStackedBar({
          data: states.flatMap(([state, column]) =>
            rows.map((row) => ({ group: state, key: truncateLabel(row['Update Group'], 36), value: Math.max(row[column] ?? 0, 0) })),
          ),
          valueTitle: 'Devices',
          theme,
        })
      },
    },
    {
      query: 'Software-Updates/Missing_Updates_By_Device',
      title: 'Devices furthest behind',
      chart: 'stackedBar',
      span: 8,
      height: '400px',
      rationale:
        'Ranking devices by missing updates, with stacks by MSRC severity, separates a few critical patches from many low ones. Severity uses the status scale: red critical, orange important, yellow moderate.',
      emptyText: 'No devices are missing required updates',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const worst = rows.toSorted((left, right) => right['Missing Updates'] - left['Missing Updates']).slice(0, 15)
        const unspecifiedOf = (row) => row['Missing Updates'] - row.Critical - row.Important - row.Moderate - row.Low
        return statusStackedBar({
          data: SEVERITIES.flatMap((severity) =>
            worst.map((row) => ({ group: severity, key: row['Computer Name'], value: severity === 'Unspecified' ? unspecifiedOf(row) : row[severity] })),
          ).filter(({ value }) => value > 0),
          valueTitle: 'Missing updates',
          labelDomain: worst.map((row) => row['Computer Name']),
          theme,
        })
      },
    },
    {
      query: 'Software-Updates/Missing_Updates_Detail',
      title: 'Most widely missing updates',
      chart: 'bar',
      span: 8,
      height: '400px',
      rationale:
        'This flips the device view around: which single updates, if deployed, would close the most gaps. Bars are colored by severity, so a widely missing critical update stands out first.',
      emptyText: 'No devices are missing required updates',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const byUpdate = [...groupRows(rows, (row) => row['Update Title'])]
          .map(([title, updateRows]) => ({ title, severity: updateRows[0].Severity, devices: updateRows.length }))
          .sort((left, right) => right.devices - left.devices)
          .slice(0, 12)
        const labelOf = ({ title }) => truncateLabel(shortUpdateTitle(title), 52)
        return horizontalBar({
          data: byUpdate.map((update) => ({ group: update.severity, key: labelOf(update), value: update.devices })),
          valueTitle: 'Devices missing',
          labelDomain: byUpdate.map(labelOf),
          colorScale: statusScale([...new Set(byUpdate.map(({ severity }) => severity))], theme),
          showLegend: true,
        })
      },
    },
    {
      query: 'Software-Updates/Last_Scan_Times',
      title: 'Update scan state',
      chart: 'donut',
      span: 8,
      height: '320px',
      rationale:
        'Scan state is part-to-whole data with a handful of categories, which is exactly where Carbon recommends a donut. Compliance numbers are only trustworthy if the "Completed" slice dominates.',
      build: (rows, { theme }) => {
        const counts = [...countBy(rows, (row) => row['Scan Status'])].sort(([, left], [, right]) => right - left)
        return donut({
          data: counts.map(([group, value]) => ({ group, value })),
          centerLabel: 'Devices',
          colorScale: statusScale(counts.map(([group]) => group), theme),
        })
      },
    },
    {
      query: 'Software-Updates/Last_Scan_Times',
      title: 'Days since last scan',
      chart: 'histogram',
      span: 8,
      height: '320px',
      rationale:
        'A completed scan last month is still stale. The age distribution shows how far back the scan results behind the compliance numbers go.',
      build: (rows, { theme }) => {
        const freshness = (days) => (days > 30 ? 'Stale (> 30 days)' : days > 7 ? 'Aging (> 7 days)' : 'Current')
        const overrides = { Current: 'succeeded', 'Aging (> 7 days)': 'caution-minor', 'Stale (> 30 days)': 'caution-major' }
        const data = rows
          .filter((row) => row['Days Since Scan'] !== null)
          .map((row) => ({ group: freshness(row['Days Since Scan']), value: Math.min(row['Days Since Scan'], 89.999) }))
        return {
          data,
          options: {
            axes: {
              bottom: { title: 'Days since last scan', mapsTo: 'value', bins: [0, 1, 2, 4, 7, 14, 21, 30, 45, 60, 90], limitDomainToBins: true },
              left: { title: 'Devices', scaleType: 'linear', stacked: true, binned: true },
            },
            color: { scale: statusScale(Object.keys(overrides), theme, overrides) },
          },
        }
      },
    },
  ],
  records: [
    {
      query: 'Software-Updates/Missing_Updates_By_Device',
      tab: 'By device',
      title: 'Missing updates by device',
      description: 'Required update counts per device, split by MSRC severity.',
      emphasis: true,
    },
    {
      query: 'Software-Updates/Missing_Updates_Detail',
      tab: 'Missing updates',
      title: 'Missing update detail',
      description: 'One row per device per required update.',
      statusColumns: { Severity: {} },
    },
    {
      query: 'Software-Updates/Update_Deployment_Status',
      tab: 'Update groups',
      title: 'Update group deployment status',
      description: 'Targeted, compliant and required device counts per software update group.',
    },
    {
      query: 'Software-Updates/Last_Scan_Times',
      tab: 'Scan times',
      title: 'Last scan times',
      description: 'Most recent software update scan per device, oldest first.',
      statusColumns: { 'Scan Status': {} },
    },
    {
      query: 'Software-Updates/Update_Compliance_Summary',
      tab: 'Classifications',
      title: 'Update compliance summary',
      description: 'Required and installed counts per update classification.',
    },
  ],
}
