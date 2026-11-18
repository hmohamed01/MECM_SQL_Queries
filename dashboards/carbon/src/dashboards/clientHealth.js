import { Activity } from '@carbon/icons-react'
import { countBy, percentOf } from '../lib/aggregate.js'
import { ordinalScale, percentGauge, proportionalMeter, statusHistogram, statusStackedBar, verticalBar, horizontalBar } from './chartBuilders.js'

const SIGNAL_OVERRIDES = { Healthy: 'succeeded', Inactive: 'caution-major', 'No client data': 'unknown' }
const signalState = (value) => ({ Active: 'Healthy', Yes: 'Healthy', Inactive: 'Inactive', No: 'Inactive' })[value] ?? 'No client data'
const INACTIVE_SEVERITIES = ['Critical (> 90 days)', 'Warning (> 60 days)', 'Inactive (> 30 days)']

// "5.00.9135.1007" sorts correctly only when each segment is compared numerically.
const compareVersionsDesc = (left, right) => {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

const statusBySite = (rows, statuses) => {
  const counts = countBy(rows, (row) => `${row['AD Site'] ?? 'No site'}|${row.Status}`)
  const sites = [...new Set(rows.map((row) => row['AD Site'] ?? 'No site'))]
  return statuses
    .flatMap((status) => sites.map((site) => ({ group: status, key: site, value: counts.get(`${site}|${status}`) ?? 0 })))
    .filter(({ value }) => value > 0)
}

export const activeClientsGauge = {
  query: 'Client-Health/Client_Status',
  title: 'Active clients',
  chart: 'gauge',
  span: 5,
  height: '260px',
  rationale:
    'A gauge suits one percentage read against a target. Its color follows Carbon status rules: green at 95% and above, yellow from 85%, red below that.',
  build: (rows, { theme }) => percentGauge({ percent: percentOf(rows.filter((row) => row['Client Status'] === 'Active').length, rows.length), theme }),
}

export const clientHealth = {
  id: 'client-health',
  navLabel: 'Client health',
  icon: Activity,
  eyebrow: 'Client-Health',
  title: 'Client health',
  summary: 'Whether ConfigMgr clients are installed, reporting and current, and which devices need a restart.',
  panels: [
    activeClientsGauge,
    {
      query: 'Client-Health/Client_Status',
      title: 'Health signals',
      chart: 'stackedBar',
      span: 11,
      height: '260px',
      rationale:
        'Client health is three separate signals: client activity, discovery heartbeat and hardware inventory. Stacking each one to the same total shows which signal is failing, using one consistent status scale.',
      build: (rows, { theme }) => {
        const signals = [
          ['Client activity', 'Client Status'],
          ['Discovery heartbeat', 'Active DDR'],
          ['Hardware inventory', 'Active HW Inventory'],
        ]
        return statusStackedBar({
          data: Object.keys(SIGNAL_OVERRIDES).flatMap((state) =>
            signals.map(([signal, column]) => ({ group: state, key: signal, value: rows.filter((row) => signalState(row[column]) === state).length })),
          ),
          valueTitle: 'Devices',
          theme,
          overrides: SIGNAL_OVERRIDES,
        })
      },
    },
    {
      query: 'Client-Health/Client_Version',
      title: 'Client version currency',
      chart: 'meter',
      span: 16,
      height: '130px',
      rationale:
        'Client versions are ordinal, newer or older, so they use one hue that fades with age, as Carbon advises for ordered data. Devices without a client are neutral gray, and the meter shows each version\'s share of the whole fleet.',
      build: (rows, { theme }) => {
        const versions = rows.map((row) => row['Client Version']).filter((version) => version !== 'No Client').sort(compareVersionsDesc)
        const ordered = [...versions, ...(rows.some((row) => row['Client Version'] === 'No Client') ? ['No Client'] : [])]
        const countOf = new Map(rows.map((row) => [row['Client Version'], row['Device Count']]))
        return proportionalMeter({
          data: ordered.map((version) => ({ group: version, value: countOf.get(version) })),
          total: rows.reduce((total, row) => total + row['Device Count'], 0),
          unit: 'devices',
          colorScale: ordinalScale(ordered, theme, { neutral: ['No Client'] }),
        })
      },
    },
    {
      query: 'Client-Health/Inactive_Clients',
      title: 'Inactive clients by site',
      chart: 'stackedBar',
      span: 8,
      height: '320px',
      rationale:
        'A site with many long-dead records points to stale discovery data, while one with many recent dropouts points to a network or client problem. Stacking by age band makes that difference visible.',
      emptyText: 'Every client has reported within the inactivity window',
      emptyKind: 'succeeded',
      build: (rows, { theme }) =>
        statusStackedBar({ data: statusBySite(rows, INACTIVE_SEVERITIES), valueTitle: 'Devices', theme }),
    },
    {
      query: 'Client-Health/Last_Boot_Time',
      title: 'Uptime distribution',
      chart: 'histogram',
      span: 8,
      height: '320px',
      rationale:
        'Uptime has a long tail that an average hides. Bins break at the query\'s 14- and 30-day thresholds, so the colored stacks match the status column exactly.',
      build: (rows, { theme }) =>
        statusHistogram({
          rows,
          valueOf: (row) => row['Uptime (Days)'],
          groupOf: (row) => row.Status,
          bins: [0, 3, 7, 10, 14, 21, 30, 45, 60, 90, 120],
          valueTitle: 'Days since last boot',
          theme,
        }),
    },
    {
      query: 'Client-Health/Pending_Reboot',
      title: 'Pending reboots by site',
      chart: 'bar',
      span: 8,
      rationale:
        'Pending restarts are a single count per site. A plain bar chart is the clearest way to compare them, so maintenance windows can target the sites that matter.',
      emptyText: 'No devices are waiting for a restart',
      emptyKind: 'succeeded',
      build: (rows) => {
        const sites = [...countBy(rows, (row) => row['AD Site'] ?? 'No site')].sort(([, left], [, right]) => right - left)
        return verticalBar({
          data: sites.map(([site, count]) => ({ group: 'Pending reboot', key: site, value: count })),
          valueTitle: 'Devices',
          labelDomain: sites.map(([site]) => site),
        })
      },
    },
    {
      query: 'Client-Health/Provisioning_Mode',
      title: 'Clients stuck in provisioning mode',
      chart: 'bar',
      span: 8,
      rationale:
        'A client stuck in provisioning mode ignores policy entirely. Grouping by operating system shows whether the failures trace back to one task sequence image.',
      emptyText: 'No clients are in provisioning mode',
      emptyKind: 'succeeded',
      build: (rows) => {
        const systems = [...countBy(rows, (row) => row['Operating System'] ?? 'Unknown')].sort(([, left], [, right]) => right - left)
        return horizontalBar({
          data: systems.map(([system, count]) => ({ group: 'Provisioning mode', key: system.replace(/^Microsoft /, ''), value: count })),
          valueTitle: 'Devices',
        })
      },
    },
  ],
  records: [
    {
      query: 'Client-Health/Inactive_Clients',
      tab: 'Inactive',
      title: 'Inactive clients',
      description: 'Devices with no discovery heartbeat in 30 days or no client data at all.',
      statusColumns: { Status: {} },
      emphasis: true,
    },
    {
      query: 'Client-Health/Pending_Reboot',
      tab: 'Pending reboot',
      title: 'Devices pending reboot',
      description: 'Devices whose last hardware inventory reported a pending restart.',
      statusColumns: { 'Pending Reboot': { Yes: 'pending' } },
    },
    {
      query: 'Client-Health/Provisioning_Mode',
      tab: 'Provisioning mode',
      title: 'Clients in provisioning mode',
      description: 'Requires the custom ProvisioningMode hardware inventory class.',
      statusColumns: { 'Provisioning Mode': { Enabled: 'caution-major', True: 'caution-major' } },
      emphasis: true,
    },
    {
      query: 'Client-Health/Last_Boot_Time',
      tab: 'Uptime',
      title: 'Last boot time',
      description: 'Every device ordered by longest uptime first.',
      statusColumns: { Status: {} },
    },
    {
      query: 'Client-Health/Client_Status',
      tab: 'All clients',
      title: 'Client status',
      description: 'Activity, heartbeat and inventory timestamps for every device.',
      statusColumns: { 'Client Status': {}, 'Active DDR': { Yes: 'succeeded', No: 'caution-major' }, 'Active HW Inventory': { Yes: 'succeeded', No: 'caution-major' } },
    },
  ],
}
