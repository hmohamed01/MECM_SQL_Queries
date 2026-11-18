import {
  AlluvialChart,
  BubbleChart,
  BulletChart,
  DonutChart,
  GaugeChart,
  HeatmapChart,
  HistogramChart,
  LollipopChart,
  MeterChart,
  SimpleBarChart,
  StackedAreaChart,
  StackedBarChart,
  TreemapChart,
  WordCloudChart,
} from '@carbon/charts-react'

// Chart types grouped by the purpose categories in Carbon's data visualization guidance.
export const CHARTS = {
  bar: { component: SimpleBarChart, name: 'Simple bar', purpose: 'Comparison' },
  lollipop: { component: LollipopChart, name: 'Lollipop', purpose: 'Comparison' },
  bubble: { component: BubbleChart, name: 'Bubble', purpose: 'Comparison' },
  wordcloud: { component: WordCloudChart, name: 'Word cloud', purpose: 'Comparison' },
  histogram: { component: HistogramChart, name: 'Histogram', purpose: 'Distribution' },
  stackedArea: { component: StackedAreaChart, name: 'Stacked area', purpose: 'Trend' },
  donut: { component: DonutChart, name: 'Donut', purpose: 'Part-to-whole' },
  stackedBar: { component: StackedBarChart, name: 'Stacked bar', purpose: 'Part-to-whole' },
  meter: { component: MeterChart, name: 'Proportional meter', purpose: 'Part-to-whole' },
  gauge: { component: GaugeChart, name: 'Gauge', purpose: 'Part-to-whole' },
  bullet: { component: BulletChart, name: 'Bullet', purpose: 'Part-to-whole' },
  treemap: { component: TreemapChart, name: 'Tree map', purpose: 'Part-to-whole' },
  heatmap: { component: HeatmapChart, name: 'Heat map', purpose: 'Correlation' },
  alluvial: { component: AlluvialChart, name: 'Alluvial', purpose: 'Connection' },
}
