import { Chip } from '@carbon/icons-react'
import { countBy, groupRows, sum, sumBy } from '../lib/aggregate.js'
import { categoricalScale, horizontalBar, ordinalScale, proportionalMeter, sequentialGradient, statusHistogram, statusStackedBar, verticalBar } from './chartBuilders.js'

const DISK_USAGE_BANDS = { 'Under 75% used': 'normal', '75–90% used': 'caution-minor', 'Over 90% used': 'caution-major' }
const diskUsageBand = (percentUsed) => (percentUsed > 90 ? 'Over 90% used' : percentUsed > 75 ? '75–90% used' : 'Under 75% used')
const LOW_DISK_SEVERITIES = ['Critical (< 5GB)', 'Warning (< 10GB)', 'Low (< 10%)']

const numericDomain = (values) => [...new Set(values)].sort((left, right) => left - right).map(String)

export const hardware = {
  id: 'hardware',
  navLabel: 'Hardware',
  icon: Chip,
  eyebrow: 'Hardware-Inventory',
  title: 'Hardware inventory',
  summary: 'Device models, memory and processor capacity, and disk headroom across the fleet.',
  panels: [
    {
      query: 'Hardware-Inventory/Device_Models',
      title: 'Most common device models',
      chart: 'bar',
      span: 10,
      height: '380px',
      rationale:
        'Model names are long, nominal labels, so a horizontal bar keeps them readable and sorted by count. Bars are colored by manufacturer so vendor share shows up without a second chart.',
      build: (rows, { theme }) => {
        const modelTotals = sumBy(rows, (row) => row.Model, (row) => row['Device Count'])
        const manufacturerOf = new Map(rows.map((row) => [row.Model, row.Manufacturer]))
        const topModels = [...modelTotals].sort(([, left], [, right]) => right - left).slice(0, 12)
        const manufacturers = [...new Set(topModels.map(([model]) => manufacturerOf.get(model)))]
        return horizontalBar({
          data: topModels.map(([model, count]) => ({ group: manufacturerOf.get(model), key: model, value: count })),
          valueTitle: 'Devices',
          labelDomain: topModels.map(([model]) => model),
          colorScale: categoricalScale(manufacturers, theme),
          showLegend: true,
        })
      },
    },
    {
      query: 'Hardware-Inventory/Memory_Summary',
      title: 'Installed memory',
      chart: 'bar',
      span: 6,
      height: '380px',
      rationale:
        'RAM tiers are ordered quantities, so they sit on the x-axis in ascending order with a single hue. Color carries no extra meaning when every bar is the same measure.',
      build: (rows) => {
        const tiers = rows.filter((row) => row['RAM (GB)'] !== null).sort((left, right) => left['RAM (GB)'] - right['RAM (GB)'])
        return verticalBar({
          data: tiers.map((row) => ({ group: 'Devices', key: `${row['RAM (GB)']} GB`, value: row['Device Count'] })),
          valueTitle: 'Devices',
          labelTitle: 'Installed RAM',
          labelDomain: tiers.map((row) => `${row['RAM (GB)']} GB`),
        })
      },
    },
    {
      query: 'Hardware-Inventory/Computer_Summary',
      title: 'CPU cores × memory',
      chart: 'heatmap',
      span: 8,
      height: '360px',
      rationale:
        'A heat map shows how two dimensions occur together. Each cell counts devices with a given core count and RAM tier, which separates developer workstations and hosts from standard laptops.',
      build: (rows, { theme }) => {
        // v_GS_PROCESSOR returns one row per socket, so cores are summed per device before counting.
        const devices = [...groupRows(rows.filter((row) => row['CPU Cores'] !== null), (row) => row.ResourceID).values()].map((socketRows) => ({
          cores: sum(socketRows, (row) => row['CPU Cores']),
          ram: socketRows[0]['RAM (GB)'],
        }))
        const counts = countBy(devices.filter((device) => device.ram !== null), (device) => `${device.cores}|${device.ram}`)
        return {
          data: [...counts].map(([key, value]) => {
            const [cores, ram] = key.split('|')
            return { cores, ram, value }
          }),
          options: {
            axes: {
              bottom: { title: 'CPU cores (all sockets)', mapsTo: 'cores', scaleType: 'labels', domain: numericDomain(devices.map((device) => device.cores)) },
              left: { title: 'RAM (GB)', mapsTo: 'ram', scaleType: 'labels', domain: numericDomain(devices.filter((device) => device.ram !== null).map((device) => device.ram)) },
            },
            heatmap: { colorLegend: { title: 'Devices' } },
            color: { gradient: sequentialGradient(theme) },
          },
        }
      },
    },
    {
      query: 'Hardware-Inventory/Disk_Space',
      title: 'OS drive utilization',
      chart: 'histogram',
      span: 8,
      height: '360px',
      rationale:
        'A histogram shows the shape of the distribution: whether drives cluster comfortably or pile up near full. Bin edges line up with the 75% and 90% thresholds, so each bar falls in one status band.',
      build: (rows, { theme }) =>
        statusHistogram({
          rows: rows.filter((row) => row.Drive === 'C:'),
          valueOf: (row) => row['Percent Used'],
          groupOf: (row) => diskUsageBand(row['Percent Used']),
          bins: Array.from({ length: 21 }, (_, index) => index * 5),
          valueTitle: 'Percent of C: used',
          theme,
          overrides: DISK_USAGE_BANDS,
        }),
    },
    {
      query: 'Hardware-Inventory/Disk_Space',
      title: 'Fleet storage consumed',
      chart: 'meter',
      span: 16,
      height: '130px',
      rationale:
        'A proportional meter compares parts of one bounded total, here all inventoried capacity. It separates OS-volume use from data-volume use, and the unfilled track is the free headroom.',
      build: (rows, { theme }) => {
        const toTerabytes = (gigabytes) => +(gigabytes / 1024).toFixed(1)
        const systemUsed = sum(rows.filter((row) => row.Drive === 'C:'), (row) => row['Used Space (GB)'])
        const dataUsed = sum(rows.filter((row) => row.Drive !== 'C:'), (row) => row['Used Space (GB)'])
        const capacity = sum(rows, (row) => row['Total Size (GB)'])
        const groups = ['OS volumes used', 'Data volumes used']
        return proportionalMeter({
          data: [
            { group: groups[0], value: toTerabytes(systemUsed) },
            { group: groups[1], value: toTerabytes(dataUsed) },
          ],
          total: toTerabytes(capacity),
          unit: 'TB',
          colorScale: ordinalScale(groups, theme),
        })
      },
    },
    {
      query: 'Hardware-Inventory/Low_Disk_Space',
      title: 'Low disk space by site',
      chart: 'stackedBar',
      span: 16,
      height: '280px',
      rationale:
        'Stacked bars show where low-disk devices are and how serious each site\'s backlog is. Severity uses Carbon status colors (red critical, orange warning, yellow low), and the records table repeats them as icons.',
      emptyText: 'No OS drives below the free space thresholds',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const counts = countBy(rows, (row) => `${row['AD Site']}|${row.Status}`)
        return statusStackedBar({
          data: LOW_DISK_SEVERITIES.flatMap((status) =>
            [...new Set(rows.map((row) => row['AD Site']))].map((site) => ({ group: status, key: site ?? 'No site', value: counts.get(`${site}|${status}`) ?? 0 })),
          ).filter(({ value }) => value > 0),
          valueTitle: 'Devices',
          theme,
        })
      },
    },
  ],
  records: [
    {
      query: 'Hardware-Inventory/Low_Disk_Space',
      tab: 'Low disk space',
      title: 'Devices low on OS drive space',
      description: 'OS drives under 10 GB or 10% free, most urgent first.',
      statusColumns: { Status: {} },
      emphasis: true,
    },
    {
      query: 'Hardware-Inventory/Computer_Summary',
      tab: 'Computer summary',
      title: 'Computer summary',
      description: 'Hardware, processor, memory and OS details for every device (one row per processor socket).',
    },
    {
      query: 'Hardware-Inventory/Disk_Space',
      tab: 'All volumes',
      title: 'Disk space',
      description: 'Capacity and free space for every local volume.',
    },
    {
      query: 'Hardware-Inventory/Device_Models',
      tab: 'Models',
      title: 'Device models',
      description: 'Device counts per manufacturer, model and chassis type.',
    },
  ],
}
