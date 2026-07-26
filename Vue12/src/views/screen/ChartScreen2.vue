<template>
  <div class="screen-page page2">
    <div class="title-bar"><h1>销量趋势与结构分析大屏</h1></div>
    <div class="grid">
      <div class="panel cell a">
        <div class="panel-title">渐变堆叠面积图 · 品牌销量趋势</div>
        <div ref="areaRef" class="chart-box"></div>
      </div>
      <div class="panel cell b">
        <div class="panel-title">带背景色的柱状图 · 月度销量</div>
        <div ref="barBgRef" class="chart-box"></div>
      </div>
      <div class="panel cell c">
        <div class="panel-title">柱状图标签旋转 · 省份销量</div>
        <div ref="barRotRef" class="chart-box"></div>
      </div>
      <div class="panel cell d">
        <div class="panel-title">嵌套环形图 · 品牌与动力类型</div>
        <div ref="ringRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { echarts, useChart } from '@/composables/useChart'
import { getTrend, getByProvince, getByBrand, getByType } from '@/api'

const areaRef = ref(null)
const barBgRef = ref(null)
const barRotRef = ref(null)
const ringRef = ref(null)
const trend = ref([])
const provinces = ref([])
const brands = ref([])
const types = ref([])

useChart(areaRef, () => {
  const months = trend.value.map(t => `${t.year}-${String(t.month).padStart(2, '0')}`)
  const sales = trend.value.map(t => t.sales)
  const amount = trend.value.map(t => Math.round(t.amount / 100))
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['销量', '金额指数'], textStyle: { color: '#9ab' }, top: 0 },
    grid: { left: 50, right: 20, top: 36, bottom: 30 },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#9ab', fontSize: 10 }, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { color: '#9ab' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    series: [
      {
        name: '销量', type: 'line', stack: 'total', smooth: true, areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,212,255,0.55)' },
            { offset: 1, color: 'rgba(0,212,255,0.02)' }
          ])
        },
        lineStyle: { width: 2, color: '#00d4ff' },
        showSymbol: false, data: sales
      },
      {
        name: '金额指数', type: 'line', stack: 'total', smooth: true, areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,209,102,0.45)' },
            { offset: 1, color: 'rgba(255,209,102,0.02)' }
          ])
        },
        lineStyle: { width: 2, color: '#ffd166' },
        showSymbol: false, data: amount
      }
    ]
  }
}, [trend])

useChart(barBgRef, () => {
  const recent = trend.value.slice(-12)
  const months = recent.map(t => `${t.month}月`)
  const sales = recent.map(t => t.sales)
  const max = Math.max(...sales, 1)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 16, top: 24, bottom: 30 },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#9ab' } },
    yAxis: { type: 'value', axisLabel: { color: '#9ab' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    series: [
      {
        type: 'bar',
        data: sales.map(() => max),
        barGap: '-100%',
        itemStyle: { color: 'rgba(255,255,255,0.06)', borderRadius: [4, 4, 0, 0] },
        silent: true,
        barWidth: 28,
        z: 1
      },
      {
        type: 'bar',
        data: sales,
        barWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4cc9f0' },
            { offset: 1, color: '#4361ee' }
          ])
        },
        z: 2
      }
    ]
  }
}, [trend])

useChart(barRotRef, () => {
  const top = provinces.value.slice(0, 12)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 70 },
    xAxis: {
      type: 'category',
      data: top.map(p => p.province),
      axisLabel: { color: '#9ab', rotate: 45, interval: 0 }
    },
    yAxis: { type: 'value', axisLabel: { color: '#9ab' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    series: [{
      type: 'bar',
      data: top.map(p => p.sales),
      label: { show: true, position: 'top', color: '#9ee', fontSize: 10, rotate: 45 },
      itemStyle: { color: '#06d6a0', borderRadius: [3, 3, 0, 0] }
    }]
  }
}, [provinces])

useChart(ringRef, () => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#9ab', fontSize: 11 } },
  series: [
    {
      name: '动力类型',
      type: 'pie',
      radius: [0, '38%'],
      label: { position: 'inner', fontSize: 11, color: '#fff' },
      data: types.value,
      color: ['#ef476f', '#ffd166', '#06d6a0']
    },
    {
      name: '品牌',
      type: 'pie',
      radius: ['52%', '72%'],
      label: { color: '#cde', fontSize: 11 },
      data: brands.value.slice(0, 6).map(b => ({ name: b.brand, value: b.sales })),
      color: ['#00d4ff', '#4895ef', '#4361ee', '#3a0ca3', '#7209b7', '#f72585']
    }
  ]
}), [brands, types])

onMounted(async () => {
  const [tr, pv, br, tp] = await Promise.all([
    getTrend({}), getByProvince({}), getByBrand({}), getByType({})
  ])
  trend.value = tr.data
  provinces.value = pv.data
  brands.value = br.data
  types.value = tp.data
})
</script>

<style scoped>
.page2 { padding: 56px 16px 16px; height: 100vh; display: flex; flex-direction: column; }
.title-bar { text-align: center; margin-bottom: 10px; }
.title-bar h1 { font-size: 24px; letter-spacing: 3px; color: #dff; }
.grid {
  flex: 1; display: grid;
  grid-template-columns: 1.4fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px; min-height: 0;
}
.cell { display: flex; flex-direction: column; min-height: 0; }
.chart-box { flex: 1; }
@media (max-width: 1000px) {
  .grid { grid-template-columns: 1fr; grid-template-rows: repeat(4, 280px); overflow: auto; }
}
</style>
