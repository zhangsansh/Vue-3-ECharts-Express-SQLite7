import { onMounted, onBeforeUnmount, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'

export function useChart(elRef, optionGetter, deps = []) {
  const chart = shallowRef(null)

  function render() {
    if (!elRef.value) return
    if (!chart.value) {
      chart.value = echarts.init(elRef.value, null, { renderer: 'canvas' })
    }
    const opt = typeof optionGetter === 'function' ? optionGetter() : optionGetter
    if (opt) chart.value.setOption(opt, true)
  }

  function resize() {
    chart.value?.resize()
  }

  onMounted(() => {
    render()
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chart.value?.dispose()
    chart.value = null
  })

  if (deps.length) {
    watch(deps, () => render(), { deep: true })
  }

  return { chart, render, resize }
}

export { echarts }
