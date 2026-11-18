import { Screen } from '@carbon/icons-react'
import { countBy, groupRows, osFamilyOf, shortOsName, sumBy } from '../lib/aggregate.js'
import { categoricalScale, ordinalScale, stackedBar } from './chartBuilders.js'

const CURRENCY = ['Latest feature update', 'One release behind', 'Two or more behind']

// Builds only compare within a product line: Windows 11, Windows 10, and each LTSC or Server caption on its own.
const productLineOf = (caption) => (caption.includes('LTSC') || caption.includes('Server') ? caption : osFamilyOf(caption))

const FEATURE_UPDATE_BY_BUILD = { 26100: '24H2', 22631: '23H2', 22621: '22H2', 22000: '21H2', 19045: '22H2', 19044: '21H2' }
const OS_FAMILIES = ['Windows 11', 'Windows 10', 'Windows Server', 'Other']

const monthStart = (value) => {
  const date = new Date(value)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
}

export const osCompositionPanel = {
  query: 'Operating-Systems/OS_Count_Summary',
  title: 'Fleet composition by operating system',
  chart: 'treemap',
  span: 8,
  height: '360px',
  rationale:
    'A tree map shows two levels of part-to-whole at once: each Windows family as a block, subdivided by edition. Thirteen editions would be unreadable as donut slices.',
  build: (rows, { theme }) => {
    const families = groupRows(rows, (row) => osFamilyOf(row['Operating System']))
    return {
      data: OS_FAMILIES.filter((family) => families.has(family)).map((family) => ({
        name: family,
        children: families.get(family).map((row) => ({
          name: shortOsName(row['Operating System']),
          value: row['Device Count'],
          showLabel: true,
        })),
      })),
      options: { color: { scale: categoricalScale(OS_FAMILIES, theme) } },
    }
  },
}

export const operatingSystems = {
  id: 'operating-systems',
  navLabel: 'Operating systems',
  icon: Screen,
  eyebrow: 'Operating-Systems',
  title: 'Operating systems',
  summary: 'Which Windows editions and feature updates the fleet runs, and how fast Windows 11 releases are rolling out.',
  panels: [
    osCompositionPanel,
    {
      query: 'Operating-Systems/OS_FeatureUpdate_Counts',
      title: 'Feature update currency per edition',
      chart: 'stackedBar',
      span: 8,
      height: '360px',
      rationale:
        'Nine builds across three product lines would need nine indistinguishable shades. Instead, each device is ranked against the newest build in its own product line. The single-hue ramp keeps "strongest = newest", matching the client and server version charts, and exact builds are in the Feature updates table.',
      build: (rows, { theme }) => {
        const buildsByLine = new Map()
        for (const row of rows) {
          const line = productLineOf(row['Operating System'])
          buildsByLine.set(line, [...new Set([...(buildsByLine.get(line) ?? []), Number(row['Build Number'])])].sort((left, right) => right - left))
        }
        const currencyOf = (row) => CURRENCY[Math.min(buildsByLine.get(productLineOf(row['Operating System'])).indexOf(Number(row['Build Number'])), 2)]
        const editionOf = (row) => shortOsName(row['Operating System'])
        const editionTotals = sumBy(rows, editionOf, (row) => row['Device Count'])
        const counts = sumBy(rows, (row) => `${editionOf(row)}|${currencyOf(row)}`, (row) => row['Device Count'])
        const editions = [...editionTotals].sort(([, left], [, right]) => right - left).map(([edition]) => edition)
        return stackedBar({
          data: CURRENCY.flatMap((currency) => editions.map((edition) => ({ group: currency, key: edition, value: counts.get(`${edition}|${currency}`) ?? 0 }))).filter(
            ({ value }) => value > 0,
          ),
          valueTitle: 'Devices',
          labelDomain: editions,
          colorScale: ordinalScale(CURRENCY, theme),
        })
      },
    },
    {
      query: 'Operating-Systems/Windows11_Clients',
      title: 'Windows 11 rollout by feature update',
      chart: 'stackedArea',
      span: 16,
      height: '340px',
      rationale:
        'Feature updates reset the OS install date, so the running total of installs per build traces each release\'s adoption curve. Stacked areas show the total and the share of each build over time.',
      build: (rows, { theme }) => {
        const datedRows = rows.filter((row) => row['OS Install Date'])
        if (datedRows.length === 0) return { data: [], options: {} }
        const builds = [...new Set(datedRows.map((row) => row['Build Number']))].sort((left, right) => Number(right) - Number(left))
        const labelOf = (build) => (FEATURE_UPDATE_BY_BUILD[build] ? `${FEATURE_UPDATE_BY_BUILD[build]} · ${build}` : `Build ${build}`)
        const installsByMonth = countBy(datedRows, (row) => `${row['Build Number']}|${monthStart(row['OS Install Date'])}`)
        const firstMonth = datedRows.reduce((earliest, row) => Math.min(earliest, monthStart(row['OS Install Date'])), Infinity)
        const months = []
        for (const cursor = new Date(firstMonth); cursor.getTime() <= Date.now(); cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
          months.push(cursor.getTime())
        }
        return {
          data: builds.flatMap((build) => {
            let runningTotal = 0
            return months.map((month) => {
              runningTotal += installsByMonth.get(`${build}|${month}`) ?? 0
              return { group: labelOf(build), date: new Date(month), value: runningTotal }
            })
          }),
          options: {
            axes: {
              bottom: { mapsTo: 'date', scaleType: 'time', title: 'OS install month' },
              left: { mapsTo: 'value', stacked: true, title: 'Devices on build' },
            },
            curve: 'curveMonotoneX',
            color: { scale: ordinalScale(builds.map(labelOf), theme) },
          },
        }
      },
    },
  ],
  records: [
    {
      query: 'Operating-Systems/Windows11_Clients',
      tab: 'Windows 11 devices',
      title: 'Windows 11 clients',
      description: 'Every device reporting a Windows 11 caption, with build, primary user and last boot.',
    },
    {
      query: 'Operating-Systems/OS_FeatureUpdate_Counts',
      tab: 'Feature updates',
      title: 'Feature update counts',
      description: 'Device counts per operating system, feature update and build number.',
    },
  ],
}

