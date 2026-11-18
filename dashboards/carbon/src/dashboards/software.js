import { Catalog } from '@carbon/icons-react'
import { countBy, distinctBy, truncateLabel } from '../lib/aggregate.js'
import { categoricalScale, horizontalBar, topDown, verticalBar } from './chartBuilders.js'

const SOFTWARE_PROMPT = 'Search for a title to see where it is installed and which versions are in use.'

export const software = {
  id: 'software',
  navLabel: 'Software',
  icon: Catalog,
  eyebrow: 'Software-Inventory',
  title: 'Software inventory',
  summary: 'What is installed across the fleet according to Add/Remove Programs, and how many versions of each title are in use.',
  panels: [
    {
      query: 'Software-Inventory/Software_Counts',
      title: 'Most installed titles',
      chart: 'lollipop',
      span: 10,
      height: '440px',
      rationale:
        'A lollipop chart compares many similar values with less ink than bars, so the eye goes to where each title ends. Titles that all sit near 100% coverage would otherwise look like one solid block.',
      build: (rows) => {
        const topTitles = rows.toSorted((left, right) => right['Install Count'] - left['Install Count']).slice(0, 15)
        const labels = topTitles.map((row) => truncateLabel(row['Software Name'], 44))
        return {
          data: topTitles.map((row, index) => ({ group: 'Installs', key: labels[index], value: row['Install Count'] })),
          options: {
            axes: {
              left: { mapsTo: 'key', scaleType: 'labels', domain: topDown(labels), truncation: { type: 'none' } },
              bottom: { mapsTo: 'value', title: 'Devices' },
            },
            legend: { enabled: false },
          },
        }
      },
    },
    {
      query: 'Software-Inventory/Installed_Software',
      title: 'Titles installed per device',
      chart: 'histogram',
      span: 6,
      height: '440px',
      rationale:
        'A histogram of titles per device separates lean standard builds from heavily customized machines. Neither a total nor an average can show that spread.',
      build: (rows) => {
        const titlesPerDevice = countBy(rows, (row) => row.ResourceID)
        const maxTitles = Math.max(...titlesPerDevice.values(), 1)
        const binWidth = Math.max(Math.ceil(maxTitles / 15), 1)
        return {
          data: [...titlesPerDevice.values()].map((value) => ({ group: 'Devices', value })),
          options: {
            axes: {
              bottom: {
                title: 'Installed titles',
                mapsTo: 'value',
                bins: Array.from({ length: Math.ceil((maxTitles + 1) / binWidth) + 1 }, (_, index) => index * binWidth),
                limitDomainToBins: true,
              },
              left: { title: 'Devices', scaleType: 'linear', binned: true },
            },
            legend: { enabled: false },
          },
        }
      },
    },
    {
      query: 'Software-Inventory/Find_Software',
      param: 'SoftwareName',
      paramPrompt: SOFTWARE_PROMPT,
      title: 'Devices with matching software, by site',
      chart: 'bar',
      span: 8,
      rationale:
        'Once a title is located, the next question is usually where it lives. Comparing distinct devices per AD site points to the deployment boundary or the team behind it.',
      emptyText: 'No installs match this search',
      build: (rows) => {
        const devicesBySite = countBy(distinctBy(rows, (row) => row.ResourceID), (row) => row['AD Site'] ?? 'No site')
        const sites = [...devicesBySite].sort(([, left], [, right]) => right - left)
        return verticalBar({
          data: sites.map(([site, count]) => ({ group: 'Devices', key: site, value: count })),
          valueTitle: 'Devices',
          labelDomain: sites.map(([site]) => site),
        })
      },
    },
    {
      query: 'Software-Inventory/Software_Versions',
      param: 'SoftwareName',
      paramPrompt: SOFTWARE_PROMPT,
      title: 'Version spread for matching titles',
      chart: 'bar',
      span: 8,
      rationale:
        'Horizontal bars list every installed version with its device count. Bars are colored by title, because a search like "%Chrome%" can match several products that share version numbers.',
      emptyText: 'No installs match this search',
      build: (rows, { theme }) => {
        const titles = [...new Set(rows.map((row) => row['Software Name']))]
        const keyOf = (row) => (titles.length > 1 ? `${truncateLabel(row['Software Name'], 22)} · ${row.Version}` : row.Version ?? 'No version')
        const topRows = rows.toSorted((left, right) => right['Install Count'] - left['Install Count']).slice(0, 20)
        return horizontalBar({
          data: topRows.map((row) => ({ group: row['Software Name'], key: keyOf(row), value: row['Install Count'] })),
          valueTitle: 'Installs',
          labelDomain: topRows.map(keyOf),
          colorScale: categoricalScale(titles, theme),
          showLegend: titles.length > 1,
        })
      },
    },
  ],
  params: [
    {
      name: 'SoftwareName',
      title: 'Software lookup',
      description: 'Runs Find_Software.sql and Software_Versions.sql. The search is wrapped in % wildcards automatically; type your own % or _ for finer LIKE patterns.',
      label: 'Software name',
      placeholder: 'e.g. Chrome, Acrobat, 7-Zip',
    },
  ],
  records: [
    {
      query: 'Software-Inventory/Software_Counts',
      tab: 'Install counts',
      title: 'Software install counts',
      description: 'Every Add/Remove Programs title with its publisher and install count.',
    },
    {
      query: 'Software-Inventory/Find_Software',
      param: 'SoftwareName',
      paramPrompt: SOFTWARE_PROMPT,
      tab: 'Search results',
      title: 'Matching installs',
      description: 'Devices with a title matching the software lookup.',
    },
    {
      query: 'Software-Inventory/Installed_Software',
      tab: 'All installs',
      title: 'Installed software',
      description: 'Every Add/Remove Programs title on every device.',
    },
  ],
}
