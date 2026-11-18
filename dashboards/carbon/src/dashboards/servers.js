import { DataCenter } from '@carbon/icons-react'
import { countBy, groupRows, sum } from '../lib/aggregate.js'
import { consolidateStatus, statusScale } from '../lib/status.js'
import { categoricalScale, donut, ordinalScale, sequentialGradient, statusHistogram, topDown } from './chartBuilders.js'

// Server_Roles returns only the OS caption, so its version is parsed with the same names the SQL CASE uses.
const serverVersionOf = (row) => {
  const captionVersion = row['Operating System']?.match(/Server (\d{4}(?: R2)?)/)?.[1]
  return row['Server Version'] ?? (captionVersion ? `Server ${captionVersion}` : 'Other')
}

const FEATURE_FAMILIES = { Web: 'IIS', RSAT: 'Admin tools', FS: 'File services', NET: '.NET', Storage: 'File services', FileAndStorage: 'File services' }
const FAMILY_ORDER = ['IIS', 'Admin tools', 'File services', '.NET', 'Platform and roles']
const featureFamilyOf = (feature) => FEATURE_FAMILIES[feature.split('-')[0]] ?? 'Platform and roles'

const versionYear = (version) => Number(version.match(/\d{4}/)?.[0] ?? 0) + (version.includes('R2') ? 0.5 : 0)
const newestFirst = (versions) => [...new Set(versions)].sort((left, right) => versionYear(right) - versionYear(left))

export const servers = {
  id: 'servers',
  navLabel: 'Servers',
  icon: DataCenter,
  eyebrow: 'Server',
  title: 'Windows Server estate',
  summary: 'Server operating system versions, capacity, installed roles and features, uptime, and TLS 1.0 exposure.',
  panels: [
    {
      query: 'Server/Server_OS_Versions',
      title: 'Server OS versions',
      chart: 'donut',
      span: 6,
      height: '360px',
      rationale:
        'Server versions are ordinal, so the slices use one blue ramp: the newest release is the strongest shade and older versions fade. The colors match the capacity bubble chart next to it.',
      build: (rows, { theme }) => {
        const counts = new Map()
        for (const row of rows) counts.set(serverVersionOf(row), (counts.get(serverVersionOf(row)) ?? 0) + row['Server Count'])
        const versions = newestFirst([...counts.keys()])
        return donut({
          data: versions.map((version) => ({ group: version, value: counts.get(version) })),
          centerLabel: 'Servers',
          colorScale: ordinalScale(versions, theme),
        })
      },
    },
    {
      query: 'Server/Server_Summary',
      title: 'Capacity: cores × memory',
      chart: 'bubble',
      span: 10,
      height: '360px',
      rationale:
        'Bubbles plot three measures at once: cores on x, memory on y (log scale, because hosts carry 30 times the RAM of a small VM), and bubble size for how many servers share that shape. Physical hosts stand apart in the top-right corner.',
      build: (rows, { theme }) => {
        // One row per processor socket, so cores are summed per server before plotting.
        const serversById = [...groupRows(rows, (row) => row.ResourceID).values()].map((socketRows) => ({
          version: serverVersionOf(socketRows[0]),
          cores: sum(socketRows, (row) => row['Total Cores']),
          ram: socketRows[0]['RAM (GB)'],
        }))
        const shapes = countBy(serversById.filter((server) => server.ram && server.cores), (server) => `${server.version}|${server.cores}|${server.ram}`)
        const versions = newestFirst(serversById.map((server) => server.version))
        return {
          data: [...shapes].map(([key, count]) => {
            const [group, cores, ram] = key.split('|')
            return { group, cores: Number(cores), ram: Number(ram), servers: count }
          }),
          options: {
            axes: {
              bottom: { title: 'Total cores', mapsTo: 'cores', includeZero: false },
              left: { title: 'RAM (GB)', mapsTo: 'ram', scaleType: 'log' },
            },
            bubble: { radiusMapsTo: 'servers', radiusLabel: 'Servers' },
            color: { scale: ordinalScale(versions, theme) },
          },
        }
      },
    },
    {
      query: 'Server/Server_Roles',
      title: 'Roles by server version',
      chart: 'heatmap',
      span: 8,
      height: '400px',
      rationale:
        'A heat map answers "which roles still run on old operating systems" in one view. Dark cells in the older-version columns are the migration backlog, broken down by workload.',
      emptyText: 'No tracked roles installed',
      build: (rows, { theme }) => {
        const versionByServer = new Map()
        const roleCounts = countBy(rows, (row) => row['Role Name'])
        const roles = [...roleCounts].sort(([, left], [, right]) => right - left).map(([role]) => role)
        for (const row of rows) versionByServer.set(row.ResourceID, serverVersionOf(row))
        const cells = countBy(rows, (row) => `${row['Role Name']}|${versionByServer.get(row.ResourceID)}`)
        return {
          data: [...cells].map(([key, value]) => {
            const [role, version] = key.split('|')
            return { role, version, value }
          }),
          options: {
            axes: {
              bottom: { title: 'Server version', mapsTo: 'version', scaleType: 'labels', domain: newestFirst([...versionByServer.values()]).reverse() },
              left: { title: 'Role', mapsTo: 'role', scaleType: 'labels', domain: topDown(roles), truncation: { type: 'none' } },
            },
            heatmap: { colorLegend: { title: 'Servers' } },
            color: { gradient: sequentialGradient(theme) },
          },
        }
      },
    },
    {
      query: 'Server/Server_Features',
      title: 'Installed features',
      chart: 'wordcloud',
      span: 8,
      height: '400px',
      rationale:
        'With 60+ feature names, any axis-based chart turns into a wall of labels. Word size shows how widespread a feature is and color groups features by family. Defaults installed on every server are left out, so the odd ones, like FS-SMB1 or Telnet-Client, are easy to spot.',
      build: (rows, { theme }) => {
        const serverCount = new Set(rows.map((row) => row.ResourceID)).size
        const featureCounts = [...countBy(rows, (row) => row['Feature Name'])]
          .filter(([, count]) => count < serverCount)
          .sort(([, left], [, right]) => right - left)
          .slice(0, 50)
        return {
          data: featureCounts.map(([word, value]) => ({ word, value, group: featureFamilyOf(word) })),
          options: {
            wordCloud: { fontSizeMapsTo: 'value', wordMapsTo: 'word', fontSizeRange: () => [12, 34] },
            color: { scale: categoricalScale(FAMILY_ORDER, theme) },
          },
        }
      },
    },
    {
      query: 'Server/Server_Uptime',
      title: 'Server uptime',
      chart: 'histogram',
      span: 8,
      height: '320px',
      rationale:
        'Long uptime on a server usually means missed patch reboots. Bins break at the query\'s 30-, 60- and 90-day thresholds, so the status colors match Server_Uptime.sql exactly.',
      build: (rows, { theme }) =>
        statusHistogram({
          rows,
          valueOf: (row) => row['Uptime (Days)'],
          groupOf: (row) => row.Status,
          bins: [0, 7, 14, 21, 30, 45, 60, 75, 90, 120, 180],
          valueTitle: 'Days since last boot',
          theme,
          overrides: { 'Critical (> 90 days)': 'failed', 'Warning (> 60 days)': 'caution-major', 'Review (> 30 days)': 'caution-minor', OK: 'succeeded' },
        }),
    },
    {
      query: 'Server/Server_TLS10_Enabled',
      title: 'TLS 1.0 exposure',
      chart: 'donut',
      span: 8,
      height: '320px',
      rationale:
        'The query returns one row per registry value, so one server can report several statuses. Each server is consolidated to its highest-attention status (Carbon\'s rule for grouped statuses) before the donut counts servers rather than registry rows.',
      build: (rows, { theme }) => {
        const statusByServer = [...groupRows(rows, (row) => row.ResourceID).values()].map((serverRows) =>
          consolidateStatus(serverRows.map((row) => row['TLS 1.0 Status'])),
        )
        const counts = [...countBy(statusByServer, (status) => status)].sort(([, left], [, right]) => right - left)
        return donut({
          data: counts.map(([group, value]) => ({ group, value })),
          centerLabel: 'Servers',
          colorScale: statusScale(counts.map(([group]) => group), theme),
        })
      },
    },
  ],
  records: [
    {
      query: 'Server/Server_TLS10_Enabled',
      tab: 'TLS 1.0',
      title: 'TLS 1.0 registry state',
      description: 'SCHANNEL TLS 1.0 server registry values per server. Requires the registry key in hardware inventory.',
      statusColumns: { 'TLS 1.0 Status': {} },
      emphasis: true,
    },
    {
      query: 'Server/Server_Uptime',
      tab: 'Uptime',
      title: 'Server uptime',
      description: 'Servers ordered by longest time since last boot.',
      statusColumns: { Status: { 'Critical (> 90 days)': 'failed', 'Warning (> 60 days)': 'caution-major', 'Review (> 30 days)': 'caution-minor' } },
    },
    {
      query: 'Server/Server_Summary',
      tab: 'Inventory',
      title: 'Server summary',
      description: 'Hardware, processor, memory and OS details per server (one row per processor socket).',
    },
    {
      query: 'Server/Server_Roles',
      tab: 'Roles',
      title: 'Server roles',
      description: 'Installed roles from the 14 tracked Windows Server roles.',
    },
    {
      query: 'Server/Server_Features',
      tab: 'Features',
      title: 'Server features',
      description: 'Every installed Windows feature per server.',
    },
    {
      query: 'Server/Server_OS_Versions',
      tab: 'OS versions',
      title: 'Server OS versions',
      description: 'Server counts per caption, version and build.',
    },
  ],
}
