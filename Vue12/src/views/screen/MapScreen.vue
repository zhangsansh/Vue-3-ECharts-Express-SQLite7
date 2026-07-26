<template>
  <div class="screen-page map-screen">
    <div class="title-bar">
      <div class="deco left"></div>
      <h1>{{ themeStore.theme.screenTitle }}</h1>
      <div class="deco right"></div>
    </div>

    <div class="kpi-row">
      <div v-for="item in kpis" :key="item.label" class="kpi panel">
        <div class="kpi-label">{{ item.label }}</div>
        <div class="kpi-value">{{ item.value }}</div>
      </div>
    </div>

    <div class="body">
      <div class="side panel">
        <div class="panel-title">品牌销量 TOP</div>
        <div ref="brandRef" class="chart-box"></div>
      </div>
      <div class="center panel">
        <div class="panel-title">全国销量分布地图 · 点击省份进入地区大屏</div>
        <div ref="mapRef" class="chart-box map-box"></div>
      </div>
      <div class="side panel">
        <div class="panel-title">动力类型占比</div>
        <div ref="typeRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { echarts, useChart } from '@/composables/useChart'
import { getOverview, getByProvince, getByBrand, getByType } from '@/api'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const mapRef = ref(null)
const brandRef = ref(null)
const typeRef = ref(null)
const overview = ref({})
const provinces = ref([])
const brands = ref([])
const types = ref([])
const mapReady = ref(false)

const kpis = computed(() => [
  { label: '累计销量(辆)', value: formatNum(overview.value.totalSales) },
  { label: '累计金额(万)', value: formatNum(Math.round((overview.value.totalAmount || 0) / 10000)) },
  { label: '覆盖品牌', value: overview.value.brandCount || 0 },
  { label: '覆盖省份', value: overview.value.provinceCount || 0 }
])

function formatNum(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString()
}

useChart(brandRef, () => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 50, right: 16, top: 20, bottom: 40 },
  xAxis: {
    type: 'category',
    data: brands.value.map(b => b.brand),
    axisLabel: { color: '#9ab', rotate: 30, fontSize: 11 },
    axisLine: { lineStyle: { color: '#345' } }
  },
  yAxis: { type: 'value', axisLabel: { color: '#9ab' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
  series: [{
    type: 'bar',
    data: brands.value.map(b => b.sales),
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#00d4ff' },
        { offset: 1, color: '#0066aa' }
      ])
    }
  }]
}), [brands])

useChart(typeRef, () => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['42%', '68%'],
    label: { color: '#cde' },
    data: types.value,
    itemStyle: {
      borderRadius: 4,
      borderColor: '#0a1628',
      borderWidth: 2
    },
    color: ['#00d4ff', '#ffd166', '#ef476f', '#06d6a0']
  }]
}), [types])

const nameMap = {
  内蒙古: '内蒙古', 黑龙江: '黑龙江', 新疆: '新疆', 西藏: '西藏',
  广西: '广西', 宁夏: '宁夏', 香港: '香港', 澳门: '澳门', 台湾: '台湾'
}

function normalizeProvince(name = '') {
  return name
    .replace(/特别行政区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '')
}

const { chart: mapChart, render: renderMap } = useChart(mapRef, () => {
  if (!mapReady.value) return null
  const data = provinces.value.map(p => ({
    name: p.province,
    value: p.sales
  }))
  // also provide full-name aliases used by china geojson
  const aliases = []
  for (const p of provinces.value) {
    const full = ['北京', '天津', '上海', '重庆'].includes(p.province)
      ? `${p.province}市`
      : ['内蒙古', '广西', '西藏', '宁夏', '新疆'].includes(p.province)
        ? ({ 内蒙古: '内蒙古自治区', 广西: '广西壮族自治区', 西藏: '西藏自治区', 宁夏: '宁夏回族自治区', 新疆: '新疆维吾尔自治区' }[p.province])
        : ['香港', '澳门'].includes(p.province)
          ? `${p.province}特别行政区`
          : p.province === '台湾'
            ? '台湾省'
            : `${p.province}省`
    aliases.push({ name: full, value: p.sales })
  }
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${normalizeProvince(p.name)}<br/>销量: ${(p.value || 0).toLocaleString()} 辆`
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d.value || 0), 1),
      left: 16,
      bottom: 20,
      text: ['高', '低'],
      textStyle: { color: '#9ab' },
      inRange: { color: ['#0b2a4a', '#1177aa', '#00d4ff', '#ffe066'] }
    },
    series: [{
      type: 'map',
      map: 'china',
      roam: true,
      emphasis: {
        label: { show: true, color: '#fff' },
        itemStyle: { areaColor: '#e02e24' }
      },
      itemStyle: {
        borderColor: 'rgba(0,212,255,0.45)',
        borderWidth: 1,
        areaColor: '#123'
      },
      data: [...data, ...aliases],
      nameMap
    }]
  }
}, [provinces, mapReady])

onMounted(async () => {
  const [ov, pv, br, tp] = await Promise.all([
    getOverview(), getByProvince({}), getByBrand({}), getByType({})
  ])
  overview.value = ov.data
  provinces.value = pv.data
  brands.value = br.data.slice(0, 8)
  types.value = tp.data

  try {
    const geo = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json').then(r => r.json())
    echarts.registerMap('china', geo)
    mapReady.value = true
    renderMap()
    mapChart.value?.on('click', (params) => {
      if (params.name) {
        const short = normalizeProvince(params.name)
        router.push(`/screen/region/${encodeURIComponent(short)}`)
      }
    })
  } catch (e) {
    console.error('地图加载失败', e)
  }
})
</script>

<style scoped>
.map-screen { padding: 56px 16px 16px; display: flex; flex-direction: column; gap: 12px; height: 100vh; }
.title-bar {
  display: flex; align-items: center; justify-content: center; gap: 16px;
}
.title-bar h1 {
  font-size: 26px; letter-spacing: 4px;
  background: linear-gradient(90deg, #9ee9ff, #fff, #9ee9ff);
  -webkit-background-clip: text; color: transparent;
}
.deco { width: 120px; height: 2px; background: linear-gradient(90deg, transparent, var(--accent)); }
.deco.right { background: linear-gradient(90deg, var(--accent), transparent); }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.kpi { padding: 12px 16px; text-align: center; }
.kpi-label { color: #8ab; font-size: 13px; }
.kpi-value { font-size: 26px; font-weight: 700; color: var(--accent); margin-top: 4px; }
.body { flex: 1; display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: 12px; min-height: 0; }
.side, .center { display: flex; flex-direction: column; min-height: 0; }
.map-box { flex: 1; min-height: 420px; }
@media (max-width: 1100px) {
  .body { grid-template-columns: 1fr; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
