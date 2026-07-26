<template>
  <div class="screen-page region-screen">
    <div class="top-row">
      <el-button class="back-btn" text @click="$router.push('/screen/map')">
        ← 返回全国地图
      </el-button>
      <div class="kpi-row">
        <div class="kpi panel" v-for="k in kpis" :key="k.label">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value" :title="String(k.value)">{{ k.value }}</div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="col left">
        <div class="panel flex1">
          <div class="panel-title">品牌销量结构</div>
          <div ref="brandRef" class="chart-box"></div>
        </div>
        <div class="panel flex1">
          <div class="panel-title">动力类型占比</div>
          <div ref="typeRef" class="chart-box"></div>
        </div>
      </div>

      <div class="col center">
        <div class="panel map-panel">
          <div class="panel-title">
            <span>{{ province }} · 地市销量地图</span>
            <span v-if="activeCity" class="city-tag">当前：{{ activeCity }}</span>
          </div>
          <div class="map-wrap">
            <div ref="mapRef" class="chart-box map-box"></div>
          </div>
        </div>
        <div class="panel rank-panel">
          <div class="panel-title">
            <span>城市销量 TOP</span>
            <span class="rank-count">共 {{ data.cities?.length || 0 }} 个</span>
          </div>
          <div class="city-rank">
            <div
              v-for="(c, i) in data.cities || []"
              :key="c.city"
              class="rank-item"
              :class="{ active: activeCity === c.city }"
              @click="focusCity(c.city)"
            >
              <i>{{ i + 1 }}</i>
              <span :title="c.city">{{ c.city }}</span>
              <b>{{ formatShort(c.sales) }}</b>
            </div>
          </div>
        </div>
      </div>

      <div class="col right">
        <div class="panel flex1">
          <div class="panel-title">月度销量趋势</div>
          <div ref="trendRef" class="chart-box"></div>
        </div>
        <div class="panel flex1">
          <div class="panel-title">热销车型 TOP10</div>
          <div ref="modelRef" class="chart-box"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { echarts, useChart } from '@/composables/useChart'
import { getProvinceDetail, getProvinceMeta } from '@/api'

const route = useRoute()
const province = computed(() => decodeURIComponent(route.params.province))
const data = ref({ brands: [], trend: [], types: [], models: [], cities: [], overview: {}, recentMonth: null })
const meta = ref(null)
const mapReady = ref(false)
const activeCity = ref('')
const mapRef = ref(null)
const brandRef = ref(null)
const trendRef = ref(null)
const typeRef = ref(null)
const modelRef = ref(null)

function formatShort(n) {
  const v = Number(n) || 0
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
  return v.toLocaleString()
}

const kpis = computed(() => [
  { label: '累计销量', value: formatShort(data.value.overview?.totalSales) },
  { label: '累计金额', value: `${((data.value.overview?.totalAmount || 0) / 1e8).toFixed(1)}亿` },
  { label: '覆盖城市', value: `${data.value.overview?.cityCount || data.value.cities?.length || 0}个` },
  {
    label: '近月销量',
    value: data.value.recentMonth
      ? formatShort(data.value.recentMonth.sales)
      : '-'
  }
])

function shortCity(name = '') {
  return name
    .replace(/特别行政区$/, '')
    .replace(/自治州$/, '')
    .replace(/地区$/, '')
    .replace(/新区$/, '')
    .replace(/市$/, '')
    .replace(/区$/, '')
    .replace(/县$/, '')
}

function matchCitySales(geoName) {
  const cities = data.value.cities || []
  const exact = cities.find(c => c.city === geoName)
  if (exact) return exact
  const short = shortCity(geoName)
  return cities.find(c =>
    c.city === short ||
    shortCity(c.city) === short ||
    geoName.includes(c.city) ||
    c.city.includes(short)
  )
}

useChart(brandRef, () => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 42, right: 10, top: 16, bottom: 48 },
  xAxis: {
    type: 'category',
    data: data.value.brands.slice(0, 8).map(b => b.brand),
    axisLabel: { color: '#9ab', rotate: 30, fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9ab', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
  },
  series: [{
    type: 'bar',
    data: data.value.brands.slice(0, 8).map(b => b.sales),
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#00d4ff' },
        { offset: 1, color: '#e02e24' }
      ])
    }
  }]
}), [data])

useChart(trendRef, () => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 10, top: 16, bottom: 28 },
  xAxis: {
    type: 'category',
    data: data.value.trend.map(t => `${String(t.year).slice(2)}-${t.month}`),
    axisLabel: { color: '#9ab', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9ab', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
  },
  series: [{
    type: 'line',
    smooth: true,
    data: data.value.trend.map(t => t.sales),
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(0,212,255,0.35)' },
        { offset: 1, color: 'rgba(0,212,255,0.02)' }
      ])
    },
    lineStyle: { color: '#00d4ff', width: 2 },
    showSymbol: false
  }]
}), [data])

useChart(typeRef, () => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['36%', '58%'],
    center: ['50%', '52%'],
    data: data.value.types,
    label: { color: '#cde', fontSize: 11 },
    color: ['#00d4ff', '#ffd166', '#ef476f', '#06d6a0']
  }]
}), [data])

useChart(modelRef, () => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 80, right: 16, top: 10, bottom: 16 },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#9ab', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
  },
  yAxis: {
    type: 'category',
    data: data.value.models.map(m => m.model).reverse(),
    axisLabel: { color: '#9ab', fontSize: 10 }
  },
  series: [{
    type: 'bar',
    data: data.value.models.map(m => m.sales).reverse(),
    itemStyle: { color: '#06d6a0', borderRadius: [0, 4, 4, 0] }
  }]
}), [data])

const { chart: mapChart, render: renderMap, resize: resizeMap } = useChart(mapRef, () => {
  if (!mapReady.value) return null
  const cities = data.value.cities || []
  const topNames = new Set(cities.slice(0, 8).map(c => c.city))
  const mapData = cities.flatMap((c) => {
    const items = [{ name: c.city, value: c.sales }]
    if (!/市|区|州|县|盟$/.test(c.city)) {
      items.push({ name: `${c.city}市`, value: c.sales })
      items.push({ name: `${c.city}区`, value: c.sales })
    }
    return items
  })
  const max = Math.max(...cities.map(c => c.sales), 1)
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p) => {
        const hit = matchCitySales(p.name)
        return `${p.name}<br/>销量：${(hit?.sales || p.value || 0).toLocaleString()} 辆`
      }
    },
    visualMap: {
      min: 0,
      max,
      show: true,
      orient: 'vertical',
      left: 8,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 80,
      text: ['高', '低'],
      textStyle: { color: '#9ab', fontSize: 10 },
      inRange: { color: ['#0b2a4a', '#1a6fa0', '#00d4ff', '#ffe066'] },
      calculable: false
    },
    series: [{
      type: 'map',
      map: 'provinceMap',
      roam: true,
      layoutCenter: ['54%', '50%'],
      layoutSize: '92%',
      scaleLimit: { min: 0.7, max: 5 },
      emphasis: {
        label: { show: true, color: '#fff', fontSize: 11 },
        itemStyle: { areaColor: '#e02e24' }
      },
      select: {
        label: { show: true, color: '#fff' },
        itemStyle: { areaColor: '#ff6b35' }
      },
      itemStyle: {
        borderColor: 'rgba(0,212,255,0.45)',
        borderWidth: 0.8,
        areaColor: '#123'
      },
      // 仅显示 TOP 城市名，避免区县标签互相遮挡
      label: {
        show: true,
        color: 'rgba(210,235,255,0.85)',
        fontSize: 10,
        formatter: (p) => (topNames.has(shortCity(p.name)) || topNames.has(p.name) ? shortCity(p.name) : '')
      },
      data: mapData,
      selectedMode: 'single'
    }]
  }
}, [data, mapReady, activeCity])

function focusCity(city) {
  activeCity.value = city
  const chart = mapChart.value
  if (!chart) return
  const candidates = [city, `${city}市`, `${city}区`, `${shortCity(city)}市`, shortCity(city)]
  chart.dispatchAction({ type: 'unselect', seriesIndex: 0 })
  for (const name of candidates) {
    chart.dispatchAction({ type: 'select', seriesIndex: 0, name })
    chart.dispatchAction({ type: 'highlight', seriesIndex: 0, name })
  }
}

async function loadMap(adcode) {
  mapReady.value = false
  try {
    const geo = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`).then(async (r) => {
      if (!r.ok) throw new Error('full map missing')
      return r.json()
    }).catch(async () => fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}.json`).then(r => r.json()))
    echarts.registerMap('provinceMap', geo)
    mapReady.value = true
    await nextTick()
    renderMap()
    resizeMap()
    mapChart.value?.off('click')
    mapChart.value?.on('click', (params) => {
      if (!params.name) return
      const hit = matchCitySales(params.name)
      activeCity.value = hit?.city || shortCity(params.name)
    })
  } catch (e) {
    console.error('省级地图加载失败', e)
  }
}

async function load() {
  activeCity.value = ''
  const [detail, metaRes] = await Promise.all([
    getProvinceDetail({ province: province.value }),
    getProvinceMeta(province.value).catch(() => ({ data: null }))
  ])
  data.value = detail.data
  meta.value = metaRes.data
  if (metaRes.data?.adcode) {
    await loadMap(metaRes.data.adcode)
  }
}

onMounted(load)
watch(province, load)
</script>

<style scoped>
.region-screen {
  box-sizing: border-box;
  padding: 58px 12px 10px;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.top-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  flex-shrink: 0;
  z-index: 2;
}
.back-btn {
  flex-shrink: 0;
  color: var(--accent) !important;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 12px !important;
  height: auto;
  background: var(--card-bg);
}
.kpi-row {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.kpi {
  padding: 8px 10px;
  text-align: center;
  min-width: 0;
  overflow: hidden;
}
.kpi-label {
  color: #8ab;
  font-size: 12px;
  white-space: nowrap;
}
.kpi-value {
  color: var(--accent);
  font-size: 18px;
  font-weight: 700;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(360px, 1.4fr) minmax(220px, 1fr);
  gap: 10px;
  overflow: hidden;
}
.col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.flex1 {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel {
  overflow: hidden;
}
.panel-title {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
}
.chart-box {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.map-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.map-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.map-box {
  position: absolute;
  inset: 0;
}
.city-tag {
  color: #ffe066;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}
.rank-count {
  color: #6a8aa8;
  font-size: 12px;
  font-weight: 400;
}

.rank-panel {
  flex: 0 0 auto;
  height: 168px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.city-rank {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: min-content;
  align-content: start;
  gap: 6px;
  padding: 0 10px 8px;
  overflow-y: auto;
  overflow-x: hidden;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 11px;
  min-width: 0;
  overflow: hidden;
}
.rank-item:hover,
.rank-item.active {
  border-color: var(--accent);
  background: rgba(0, 212, 255, 0.14);
}
.rank-item i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 212, 255, 0.25);
  font-style: normal;
  font-size: 10px;
  flex-shrink: 0;
}
.rank-item span {
  flex: 1;
  color: #cde;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.rank-item b {
  color: var(--accent);
  font-size: 10px;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .body {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .map-wrap { min-height: 360px; }
  .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .city-rank { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
