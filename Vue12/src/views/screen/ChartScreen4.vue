<template>
  <div class="screen-page page4">
    <div class="title-bar"><h1>效能监控与三维洞察大屏</h1></div>
    <div class="grid">
      <div class="panel cell">
        <div class="panel-title">带标签数字动画的基础仪表盘</div>
        <div ref="gaugeRef" class="chart-box"></div>
      </div>
      <div class="panel cell">
        <div class="panel-title">阶段速度仪表盘</div>
        <div ref="speedRef" class="chart-box"></div>
      </div>
      <div class="panel cell">
        <div class="panel-title">打卡统计柱状图</div>
        <div ref="checkinRef" class="chart-box"></div>
      </div>
      <div class="panel cell wide">
        <div class="panel-title">三维散点图 · 省份×品牌×销量</div>
        <div ref="scatter3dRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { echarts, useChart } from '@/composables/useChart'
import { getOverview, getByProvince, getByBrand } from '@/api'

const gaugeRef = ref(null)
const speedRef = ref(null)
const checkinRef = ref(null)
const scatter3dRef = ref(null)
const overview = ref({})
const provinces = ref([])
const brands = ref([])
const gaugeValue = ref(72)
let gaugeTimer

useChart(gaugeRef, () => ({
  series: [{
    type: 'gauge',
    min: 0, max: 100,
    progress: { show: true, width: 14 },
    axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(255,255,255,0.08)']] } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { width: 2, color: '#456' } },
    axisLabel: { color: '#9ab', distance: 18 },
    pointer: { itemStyle: { color: '#00d4ff' } },
    anchor: { show: true, showAbove: true, size: 16, itemStyle: { borderWidth: 2, borderColor: '#00d4ff' } },
    title: { show: true, offsetCenter: [0, '70%'], color: '#9ab', fontSize: 13 },
    detail: {
      valueAnimation: true,
      formatter: '{value}%',
      color: '#fff',
      fontSize: 28,
      offsetCenter: [0, '40%']
    },
    data: [{ value: gaugeValue.value, name: '模型效能' }]
  }]
}), [gaugeValue])

useChart(speedRef, () => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0, max: 240,
    splitNumber: 8,
    axisLine: {
      lineStyle: {
        width: 18,
        color: [
          [0.25, '#06d6a0'],
          [0.5, '#ffd166'],
          [0.75, '#f4a261'],
          [1, '#e02e24']
        ]
      }
    },
    pointer: { itemStyle: { color: 'auto' } },
    axisTick: { distance: -18, length: 6, lineStyle: { color: '#fff', width: 1 } },
    splitLine: { distance: -22, length: 14, lineStyle: { color: '#fff', width: 2 } },
    axisLabel: { color: '#9ab', distance: 28, fontSize: 11 },
    detail: {
      valueAnimation: true,
      formatter: '{value} km/h',
      color: '#dff',
      fontSize: 20,
      offsetCenter: [0, '70%']
    },
    title: { offsetCenter: [0, '88%'], color: '#8ab', fontSize: 12 },
    data: [{ value: 128 + Math.round(Math.random() * 40), name: '训练吞吐速度' }]
  }]
}), [overview])

useChart(checkinRef, () => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const trained = days.map(() => 60 + Math.round(Math.random() * 40))
  const predicted = days.map(() => 40 + Math.round(Math.random() * 50))
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['训练打卡', '预测打卡'], textStyle: { color: '#9ab' } },
    grid: { left: 40, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: days, axisLabel: { color: '#9ab' } },
    yAxis: { type: 'value', axisLabel: { color: '#9ab' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    series: [
      {
        name: '训练打卡', type: 'bar', data: trained, barWidth: 16,
        itemStyle: { color: '#00d4ff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '预测打卡', type: 'bar', data: predicted, barWidth: 16,
        itemStyle: { color: '#ffd166', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
}, [])

useChart(scatter3dRef, () => {
  const ps = provinces.value.slice(0, 10)
  const bs = brands.value.slice(0, 8)
  const data = []
  ps.forEach((p, i) => {
    bs.forEach((b, j) => {
      data.push([i, j, Math.round((p.sales / (bs.length + 1)) * (0.4 + Math.random()))])
    })
  })
  return {
    tooltip: {},
    visualMap: {
      show: true, min: 0,
      max: Math.max(...data.map(d => d[2]), 1),
      inRange: { symbolSize: [6, 28], color: ['#4361ee', '#00d4ff', '#ffd166', '#e02e24'] },
      textStyle: { color: '#9ab' },
      right: 10, top: 20
    },
    xAxis3D: { type: 'category', data: ps.map(p => p.province), name: '省份', axisLabel: { color: '#9ab' } },
    yAxis3D: { type: 'category', data: bs.map(b => b.brand), name: '品牌', axisLabel: { color: '#9ab' } },
    zAxis3D: { type: 'value', name: '销量', axisLabel: { color: '#9ab' } },
    grid3D: {
      boxWidth: 120, boxDepth: 90, viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 6 },
      light: { main: { intensity: 1.2 }, ambient: { intensity: 0.4 } }
    },
    series: [{
      type: 'scatter3D',
      data,
      shading: 'lambert',
      label: { show: false }
    }]
  }
}, [provinces, brands])

onMounted(async () => {
  const [ov, pv, br] = await Promise.all([getOverview(), getByProvince({}), getByBrand({})])
  overview.value = ov.data
  provinces.value = pv.data
  brands.value = br.data
  const base = Math.min(95, Math.round(((ov.data.totalSales || 1) % 10000) / 100) + 60)
  gaugeValue.value = base
  gaugeTimer = setInterval(() => {
    gaugeValue.value = Math.max(50, Math.min(98, gaugeValue.value + (Math.random() > 0.5 ? 1 : -1)))
  }, 2000)
})

onBeforeUnmount(() => clearInterval(gaugeTimer))
</script>

<style scoped>
.page4 { padding: 56px 16px 16px; height: 100vh; display: flex; flex-direction: column; }
.title-bar { text-align: center; margin-bottom: 10px; }
.title-bar h1 { font-size: 24px; letter-spacing: 3px; }
.grid {
  flex: 1; min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr 1.2fr;
  gap: 12px;
}
.cell { display: flex; flex-direction: column; min-height: 0; }
.cell.wide { grid-column: span 3; }
.chart-box { flex: 1; }
@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; overflow: auto; }
  .cell.wide { grid-column: auto; }
  .chart-box { min-height: 280px; }
}
</style>
