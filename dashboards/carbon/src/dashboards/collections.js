import { GroupObjects } from '@carbon/icons-react'
import { countBy, truncateLabel } from '../lib/aggregate.js'
import { categoricalScale, donut, horizontalBar, verticalBar } from './chartBuilders.js'

// A fixed order means each refresh type keeps the same categorical color on every collection chart.
const REFRESH_TYPES = ['Incremental and Scheduled', 'Scheduled', 'Incremental', 'Manual', 'Unknown']
const COLLECTION_PROMPT = 'Enter an exact collection name, such as "All Workstations", to chart its members.'
const DEVICE_PROMPT = 'Enter an exact computer name to list every collection it belongs to.'

const refreshCounts = (rows) => {
  const counts = countBy(rows, (row) => row['Refresh Type'] ?? 'Unknown')
  return REFRESH_TYPES.filter((type) => counts.has(type)).map((type) => ({ group: type, value: counts.get(type) }))
}

export const collections = {
  id: 'collections',
  navLabel: 'Collections',
  icon: GroupObjects,
  eyebrow: 'Collections',
  title: 'Collections',
  summary: 'Collection sizes and refresh behavior, collections that evaluate to nothing, and membership lookups for a collection or a device.',
  panels: [
    {
      query: 'Collections/Collection_Summary',
      title: 'Refresh schedule mix',
      chart: 'donut',
      span: 6,
      height: '340px',
      rationale:
        'Refresh type is a small set of parts that add up to all collections, which suits a donut. A large incremental slice is worth watching, because incremental evaluation is the main load on the collection evaluator.',
      build: (rows, { theme }) => donut({ data: refreshCounts(rows), centerLabel: 'Collections', colorScale: categoricalScale(REFRESH_TYPES, theme) }),
    },
    {
      query: 'Collections/Collection_Summary',
      title: 'Largest collections',
      chart: 'bar',
      span: 10,
      height: '340px',
      rationale:
        'Collection names are long, so the ranking runs on horizontal bars. Bars share the donut\'s refresh-type colors, which connects size to evaluation cost across both panels.',
      build: (rows, { theme }) => {
        const largest = rows.toSorted((left, right) => right['Member Count'] - left['Member Count']).slice(0, 12)
        const labelOf = (row) => truncateLabel(row['Collection Name'], 40)
        return horizontalBar({
          data: largest.map((row) => ({ group: row['Refresh Type'] ?? 'Unknown', key: labelOf(row), value: row['Member Count'] })),
          valueTitle: 'Members',
          labelDomain: largest.map(labelOf),
          colorScale: categoricalScale(REFRESH_TYPES, theme),
          showLegend: true,
        })
      },
    },
    {
      query: 'Collections/Empty_Collections',
      title: 'Empty collections by refresh type',
      chart: 'bar',
      span: 16,
      height: '240px',
      rationale:
        'An empty collection on a schedule or incremental refresh still costs evaluation cycles for nothing. Bars in the same refresh-type colors show which empties are free to keep and which are worth deleting.',
      emptyText: 'Every collection has at least one member',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const counts = refreshCounts(rows)
        return horizontalBar({
          data: counts.map(({ group, value }) => ({ group, key: group, value })),
          valueTitle: 'Empty collections',
          labelDomain: counts.map(({ group }) => group),
          colorScale: categoricalScale(REFRESH_TYPES, theme),
        })
      },
    },
    {
      query: 'Collections/Collection_Members',
      param: 'CollectionName',
      paramPrompt: COLLECTION_PROMPT,
      title: 'Members by AD site',
      chart: 'bar',
      span: 16,
      rationale:
        'Within one collection, membership type is the same for every row. Site is what varies, and it is what matters when you plan a deployment or maintenance window for that collection.',
      emptyText: 'No members, or no collection with that exact name',
      emptyKind: 'unknown',
      build: (rows) => {
        const sites = [...countBy(rows, (row) => row['AD Site'] ?? 'No site')].sort(([, left], [, right]) => right - left)
        return verticalBar({
          data: sites.map(([site, count]) => ({ group: 'Members', key: site, value: count })),
          valueTitle: 'Members',
          labelDomain: sites.map(([site]) => site),
        })
      },
    },
    {
      query: 'Collections/Device_Collection_Membership',
      param: 'ComputerName',
      paramPrompt: DEVICE_PROMPT,
      title: 'How the device is targeted',
      chart: 'donut',
      span: 16,
      rationale:
        'Direct rules are hand-maintained exceptions, and query rules follow the device as it changes. The donut shows how much of the device\'s targeting depends on someone keeping direct memberships current.',
      emptyText: 'No collections, or no device with that exact name',
      emptyKind: 'unknown',
      build: (rows, { theme }) => {
        const counts = countBy(rows, (row) => row['Membership Type'])
        return donut({
          data: [...counts].map(([group, value]) => ({ group, value })),
          centerLabel: 'Collections',
          colorScale: categoricalScale(['Query', 'Direct'], theme),
        })
      },
    },
  ],
  params: [
    {
      name: 'CollectionName',
      title: 'Collection lookup',
      description: 'Runs Collection_Members.sql. The SQL matches the collection name exactly.',
      label: 'Collection name',
      placeholder: 'e.g. All Workstations',
    },
    {
      name: 'ComputerName',
      title: 'Device lookup',
      description: 'Runs Device_Collection_Membership.sql. The SQL matches the computer name exactly.',
      label: 'Computer name',
      placeholder: 'e.g. HQ-LT1001',
    },
  ],
  records: [
    {
      query: 'Collections/Collection_Summary',
      tab: 'All collections',
      title: 'Collection summary',
      description: 'Member counts, refresh behavior and limiting collection for every device collection.',
    },
    {
      query: 'Collections/Empty_Collections',
      tab: 'Empty',
      title: 'Empty collections',
      description: 'Device collections with zero members.',
      emphasis: true,
    },
    {
      query: 'Collections/Collection_Members',
      param: 'CollectionName',
      paramPrompt: COLLECTION_PROMPT,
      tab: 'Collection members',
      title: 'Collection members',
      description: 'Members of the collection from the collection lookup.',
    },
    {
      query: 'Collections/Device_Collection_Membership',
      param: 'ComputerName',
      paramPrompt: DEVICE_PROMPT,
      tab: 'Device membership',
      title: 'Device collection membership',
      description: 'Collections containing the device from the device lookup.',
    },
  ],
}
