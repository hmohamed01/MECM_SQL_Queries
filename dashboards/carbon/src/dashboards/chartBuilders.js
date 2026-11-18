import { blue, gray } from '@carbon/colors'
import { statusColor, statusScale } from '../lib/status.js'
import { formatNumber } from '../lib/aggregate.js'

const isDarkTheme = (theme) => theme === 'g90' || theme === 'g100'

// Labels are shortened deliberately before charting, so Carbon's 16-character axis truncation is switched off.
const labelAxis = (axis) => ({ scaleType: 'labels', truncation: { type: 'none' }, ...axis })

// Carbon draws a vertical label axis from the bottom up; callers pass rankings top-down, so the domain is flipped.
export const topDown = (domain) => domain?.toReversed()

// Carbon's 14-color categorical sequence, in the order the guidelines prescribe for light and dark themes.
const CATEGORICAL_LIGHT = ['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#fa4d56', '#570408', '#198038', '#002d9c', '#ee538b', '#b28600', '#009d9a', '#012749', '#8a3800', '#a56eff']
const CATEGORICAL_DARK = ['#8a3ffc', '#33b1ff', '#007d79', '#ff7eb6', '#fa4d56', '#fff1f1', '#6fdc8c', '#4589ff', '#d12771', '#d2a106', '#08bdba', '#bae6ff', '#ba4e00', '#d4bbff']

// Pinning labels to palette slots keeps a category the same color on every chart that shows it.
export const categoricalScale = (labels, theme) => {
  const palette = isDarkTheme(theme) ? CATEGORICAL_DARK : CATEGORICAL_LIGHT
  return Object.fromEntries(labels.map((label, index) => [label, palette[index % palette.length]]))
}

// Sequential magnitude for heat maps. Dark themes flip the ramp so the highest values are the lightest, per Carbon guidance.
export const sequentialGradient = (theme) => {
  const ramp = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((step) => blue[step])
  return { colors: isDarkTheme(theme) ? ramp.toReversed() : ramp }
}

// Ordinal data (versions, sizes) uses one hue; the most prominent shade goes to the first label.
export const ordinalScale = (labels, theme, { neutral = [] } = {}) => {
  const steps = isDarkTheme(theme) ? [20, 30, 40, 50, 60, 70, 80] : [80, 70, 60, 50, 40, 30, 20]
  const ordered = labels.filter((label) => !neutral.includes(label))
  const stride = ordered.length > 1 ? (steps.length - 1) / (ordered.length - 1) : 0
  return {
    ...Object.fromEntries(ordered.map((label, index) => [label, blue[steps[Math.round(index * stride)]]])),
    ...Object.fromEntries(neutral.map((label) => [label, gray[50]])),
  }
}

export const horizontalBar = ({ data, valueTitle, labelTitle, colorScale, showLegend = false, labelDomain }) => ({
  data,
  options: {
    axes: {
      left: labelAxis({ mapsTo: 'key', title: labelTitle, domain: topDown(labelDomain) }),
      bottom: { mapsTo: 'value', title: valueTitle, ticks: { number: 5 } },
    },
    legend: { enabled: showLegend },
    color: colorScale ? { scale: colorScale } : undefined,
  },
})

export const verticalBar = ({ data, valueTitle, labelTitle, colorScale, showLegend = false, labelDomain }) => ({
  data,
  options: {
    axes: {
      bottom: labelAxis({ mapsTo: 'key', title: labelTitle, domain: labelDomain }),
      left: { mapsTo: 'value', title: valueTitle },
    },
    legend: { enabled: showLegend },
    color: colorScale ? { scale: colorScale } : undefined,
  },
})

export const stackedBar = ({ data, valueTitle, labelTitle, orientation = 'horizontal', colorScale, labelDomain }) => {
  const categoryAxis = labelAxis({ mapsTo: 'key', title: labelTitle, domain: orientation === 'horizontal' ? topDown(labelDomain) : labelDomain })
  const valueAxis = { mapsTo: 'value', stacked: true, title: valueTitle, ticks: { number: 5 } }
  return {
    data,
    options: {
      axes: orientation === 'horizontal' ? { left: categoryAxis, bottom: valueAxis } : { bottom: categoryAxis, left: valueAxis },
      color: colorScale ? { scale: colorScale } : undefined,
    },
  }
}

// Stacked bar whose stacks are status labels: colors come from Carbon status tokens, not the categorical palette.
export const statusStackedBar = ({ data, theme, overrides, ...rest }) =>
  stackedBar({ data, colorScale: statusScale([...new Set(data.map(({ group }) => group))], theme, overrides), ...rest })

export const donut = ({ data, centerLabel, colorScale }) => ({
  data,
  options: {
    donut: { center: { label: centerLabel }, alignment: 'center' },
    pie: { labels: { enabled: false } },
    legend: { alignment: 'center' },
    color: colorScale ? { scale: colorScale } : undefined,
  },
})

export const proportionalMeter = ({ data, total, unit, colorScale }) => ({
  data,
  options: {
    meter: { proportional: { total, unit, totalFormatter: (value) => formatNumber(value) } },
    color: colorScale ? { scale: colorScale } : undefined,
    toolbar: { enabled: false },
    height: '130px',
  },
})

// The gauge's `status` only drives a small indicator, so the arc itself is colored with the matching status token.
export const percentGauge = ({ percent, theme, thresholds = [95, 85] }) => {
  const [status, kind] = percent >= thresholds[0] ? ['success', 'succeeded'] : percent >= thresholds[1] ? ['warning', 'caution-minor'] : ['danger', 'failed']
  return {
    data: [{ group: 'value', value: +percent.toFixed(1) }],
    options: {
      gauge: { type: 'semi', status, deltaArrow: { enabled: false } },
      color: { scale: { value: statusColor(kind, theme) } },
      toolbar: { enabled: false },
    },
  }
}

// Bins aligned to status thresholds keep each histogram bar inside a single status band. The SQL thresholds are
// strict ("> 14 days") while histogram bins include their lower edge, so values shift down by an epsilon first.
export const statusHistogram = ({ rows, valueOf, groupOf, bins, valueTitle, theme, overrides }) => {
  const data = rows
    .map((row) => ({ group: groupOf(row), value: valueOf(row) }))
    .filter(({ value }) => value !== null && value !== undefined)
    .map(({ group, value }) => ({ group, value: Math.min(Math.max(value - 0.001, bins[0]), bins.at(-1) - 0.001) }))
  return {
    data,
    options: {
      axes: {
        bottom: { title: valueTitle, mapsTo: 'value', bins, limitDomainToBins: true },
        left: { title: 'Devices', scaleType: 'linear', stacked: true, binned: true },
      },
      color: { scale: statusScale([...new Set(data.map(({ group }) => group))], theme, overrides) },
    },
  }
}
