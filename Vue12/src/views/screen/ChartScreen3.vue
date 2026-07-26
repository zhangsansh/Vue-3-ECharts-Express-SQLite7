<template>
  <div class="screen-page page3">
    <div class="title-bar"><h1>关系流转与质量结构大屏</h1></div>
    <div class="grid">
      <div class="panel cell">
        <div class="panel-title">饼图纹理 · 品牌份额</div>
        <div ref="pieTexRef" class="chart-box"></div>
      </div>
      <div class="panel cell">
        <div class="panel-title">单轴散点图 · 省份销量分布</div>
        <div ref="scatterRef" class="chart-box"></div>
      </div>
      <div class="panel cell">
        <div class="panel-title">漏斗图 · 转化漏斗</div>
        <div ref="funnelRef" class="chart-box"></div>
      </div>

      <div class="panel cell radar-cell">
        <div class="panel-title">AQI · 雷达图（区域综合指数）</div>
        <div ref="radarRef" class="chart-box"></div>
      </div>
      <div class="panel cell">
        <div class="panel-title">桑基图节点自定义样式</div>
        <div ref="sankeyNodeRef" class="chart-box"></div>
      </div>

      <div class="panel cell sankey-edge-cell">
        <div class="panel-title">桑基图渐变色边 · 区域→品牌→动力类型</div>
        <div ref="sankeyEdgeRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { echarts, useChart } from '@/composables/useChart'
import { getByBrand, getByProvince, getByType } from '@/api'

const pieTexRef = ref(null)
const scatterRef = ref(null)
const radarRef = ref(null)
const sankeyNodeRef = ref(null)
const sankeyEdgeRef = ref(null)
const funnelRef = ref(null)
const brands = ref([])
const provinces = ref([])
const types = ref([])

function makeTexturePattern(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 10
  canvas.height = 10
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 10, 10)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.moveTo(0, 10)
  ctx.lineTo(10, 0)
  ctx.stroke()
  return { image: canvas, repeat: 'repeat' }
}

useChart(pieTexRef, () => {
  const colors = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5', '#00bbf9']
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '62%',
      center: ['50%', '52%'],
      data: brands.value.slice(0, 6).map((b, i) => ({
        name: b.brand,
        value: b.sales,
        itemStyle: { color: makeTexturePattern(colors[i % colors.length]) }
      })),
      label: { color: '#cde', fontSize: 11 }
    }]
  }
}, [brands])

useChart(scatterRef, () => {
  const top = provinces.value.slice(0, 15)
  return {
    tooltip: {
      formatter: (p) => `${top[p.data[0]]?.province || ''}<br/>销量: ${p.data[1]}`
    },
    singleAxis: {
      type: 'category',
      data: top.map(p => p.province),
      left: 36, right: 36, top: '42%', bottom: '42%',
      axisLabel: { color: '#9ab', interval: 0, rotate: 30, fontSize: 10 },
      axisLine: { lineStyle: { color: '#456' } }
    },
    series: [{
      type: 'scatter',
      coordinateSystem: 'singleAxis',
      data: top.map((p, i) => [i, p.sales]),
      symbolSize: (val) => Math.max(10, Math.min(40, val[1] / 8000)),
      itemStyle: { color: '#00d4ff', shadowBlur: 10, shadowColor: '#00d4ff' }
    }]
  }
}, [provinces])

useChart(radarRef, () => {
  const regions = ['华东', '华南', '华北', '西南', '西北']
  const dims = ['销量规模', '增长潜力', '品牌密度', '渗透率', '稳定性', '预测置信']
  // 基于真实销量生成更稳定的区域指数，避免随机跳动
  const regionProvinces = {
    华东: ['上海', '江苏', '浙江', '安徽', '山东', '福建', '江西'],
    华南: ['广东', '广西', '海南', '香港', '澳门'],
    华北: ['北京', '天津', '河北', '山西', '内蒙古'],
    西南: ['四川', '重庆', '贵州', '云南', '西藏'],
    西北: ['陕西', '甘肃', '青海', '宁夏', '新疆']
  }
  const salesMap = Object.fromEntries(provinces.value.map(p => [p.province, p.sales || 0]))
  const maxSales = Math.max(...provinces.value.map(p => p.sales || 0), 1)
  const seriesData = regions.map((name, idx) => {
    const list = regionProvinces[name] || []
    const total = list.reduce((s, p) => s + (salesMap[p] || 0), 0)
    const avg = total / Math.max(list.length, 1)
    const scale = Math.min(98, Math.round((total / (maxSales * 3.2)) * 100) + 28)
    const growth = 55 + ((idx * 7) % 30)
    const density = 50 + Math.min(40, list.length * 5)
    const penetrate = Math.min(95, Math.round(avg / maxSales * 90) + 35)
    const stable = 60 + ((idx * 9) % 25)
    const conf = 58 + ((idx * 11) % 28)
    return {
      name,
      value: [scale, growth, density, penetrate, stable, conf],
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 2 }
    }
  })
  return {
    tooltip: { trigger: 'item' },
    legend: {
      data: regions,
      orient: 'vertical',
      right: 8,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 8,
      textStyle: { color: '#9ab', fontSize: 11 }
    },
    radar: {
      center: ['42%', '52%'],
      radius: '58%',
      indicator: dims.map(n => ({ name: n, max: 100 })),
      axisName: { color: '#9ab', fontSize: 11, padding: [0, 0, 0, 0] },
      splitNumber: 4,
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'rgba(0,212,255,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(0,212,255,0.25)' } },
      splitLine: { lineStyle: { color: 'rgba(0,212,255,0.2)' } }
    },
    series: [{
      type: 'radar',
      data: seriesData,
      symbol: 'circle',
      symbolSize: 4
    }]
  }
}, [provinces])

useChart(sankeyNodeRef, () => {
  const nodes = [
    { name: '一线城市', itemStyle: { color: '#e02e24', borderColor: '#fff', borderWidth: 2 } },
    { name: '新一线', itemStyle: { color: '#ff9f1c', borderRadius: 8 } },
    { name: '比亚迪', itemStyle: { color: '#00d4ff' } },
    { name: '特斯拉', itemStyle: { color: '#cc0000' } },
    { name: '理想', itemStyle: { color: '#06d6a0' } },
    { name: '纯电', itemStyle: { color: '#9b5de5' } },
    { name: '混动', itemStyle: { color: '#f15bb5' } }
  ]
  const links = [
    { source: '一线城市', target: '比亚迪', value: 40 },
    { source: '一线城市', target: '特斯拉', value: 30 },
    { source: '新一线', target: '比亚迪', value: 35 },
    { source: '新一线', target: '理想', value: 28 },
    { source: '比亚迪', target: '纯电', value: 45 },
    { source: '比亚迪', target: '混动', value: 30 },
    { source: '特斯拉', target: '纯电', value: 30 },
    { source: '理想', target: '混动', value: 28 }
  ]
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      left: '6%',
      right: '12%',
      top: '8%',
      bottom: '8%',
      nodeWidth: 14,
      nodeGap: 14,
      data: nodes,
      links,
      label: { color: '#dff', fontSize: 11 },
      lineStyle: { color: 'source', opacity: 0.4, curveness: 0.5 },
      emphasis: { focus: 'adjacency' }
    }]
  }
}, [])

useChart(sankeyEdgeRef, () => {
  const topB = brands.value.slice(0, 4).map(b => b.brand)
  const regions = ['东部', '南部', '西部', '北部']
  const tNames = (types.value.length ? types.value : [{ name: '纯电动' }, { name: '插电混动' }, { name: '增程式' }])
    .map(t => t.name)
    .slice(0, 3)
  if (!topB.length) return null
  const nodes = [
    ...regions.map(name => ({ name, depth: 0 })),
    ...topB.map(name => ({ name, depth: 1 })),
    ...tNames.map(name => ({ name, depth: 2 }))
  ]
  const links = []
  regions.forEach((r, i) => {
    topB.forEach((b, j) => {
      links.push({
        source: r,
        target: b,
        value: 20 + ((i + j) * 7) % 30,
        lineStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#e02e24' }
          ]),
          opacity: 0.4,
          curveness: 0.5
        }
      })
    })
  })
  topB.forEach((b, i) => {
    tNames.forEach((t, j) => {
      links.push({
        source: b,
        target: t,
        value: 15 + ((i + j) * 5) % 25,
        lineStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#ffd166' },
            { offset: 1, color: '#06d6a0' }
          ]),
          opacity: 0.38,
          curveness: 0.5
        }
      })
    })
  })
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey',
      orient: 'horizontal',
      left: '4%',
      right: '8%',
      top: '10%',
      bottom: '8%',
      nodeAlign: 'justify',
      nodeWidth: 18,
      nodeGap: 16,
      layoutIterations: 32,
      data: nodes,
      links,
      label: {
        color: '#cde',
        fontSize: 12,
        position: 'right'
      },
      levels: [
        { depth: 0, label: { position: 'left' } },
        { depth: 1, label: { position: 'right' } },
        { depth: 2, label: { position: 'right' } }
      ],
      emphasis: { focus: 'adjacency' }
    }]
  }
}, [brands, types])

useChart(funnelRef, () => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'funnel',
    left: '14%',
    top: '12%',
    bottom: '8%',
    width: '68%',
    label: { color: '#dff', fontSize: 11 },
    data: [
      { value: 100, name: '线索曝光' },
      { value: 72, name: '到店意向' },
      { value: 48, name: '试驾完成' },
      { value: 28, name: '订单锁定' },
      { value: 16, name: '交付上牌' }
    ].map((d, i) => ({
      ...d,
      itemStyle: {
        color: ['#00d4ff', '#4cc9f0', '#4895ef', '#4361ee', '#e02e24'][i]
      }
    }))
  }]
}), [])

onMounted(async () => {
  const [br, pv, tp] = await Promise.all([getByBrand({}), getByProvince({}), getByType({})])
  brands.value = br.data
  provinces.value = pv.data
  types.value = tp.data
})
</script>

<style scoped>
.page3 {
  padding: 56px 16px 12px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.title-bar { text-align: center; margin-bottom: 8px; }
.title-bar h1 { font-size: 24px; letter-spacing: 3px; }
.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 1fr 1.05fr 1.15fr;
  gap: 10px;
}
.cell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.cell:nth-child(1),
.cell:nth-child(2),
.cell:nth-child(3) { grid-column: span 2; }
.radar-cell { grid-column: span 3; }
.radar-cell + .cell { grid-column: span 3; }
.sankey-edge-cell { grid-column: 1 / -1; }
.chart-box { flex: 1; min-height: 0; width: 100%; }
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    overflow: auto;
  }
  .cell:nth-child(1),
  .cell:nth-child(2),
  .cell:nth-child(3),
  .radar-cell,
  .radar-cell + .cell,
  .sankey-edge-cell { grid-column: auto; }
  .chart-box { min-height: 260px; }
}
</style>
