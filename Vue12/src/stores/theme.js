import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTheme, saveTheme } from '@/api'

const defaultTheme = {
  primaryColor: '#e02e24',
  bgColor: '#0a1628',
  bgGradient: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d2137 100%)',
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize: 14,
  textColor: '#e8f1ff',
  accentColor: '#00d4ff',
  cardBg: 'rgba(10, 30, 60, 0.75)',
  borderColor: 'rgba(0, 212, 255, 0.3)',
  screenTitle: '新能源汽车销量数据分析系统'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref({ ...defaultTheme })

  function applyCss(t) {
    const root = document.documentElement
    root.style.setProperty('--primary', t.primaryColor)
    root.style.setProperty('--accent', t.accentColor)
    root.style.setProperty('--bg', t.bgColor)
    root.style.setProperty('--bg-gradient', t.bgGradient)
    root.style.setProperty('--text', t.textColor)
    root.style.setProperty('--card-bg', t.cardBg)
    root.style.setProperty('--border', t.borderColor)
    root.style.setProperty('--font', t.fontFamily)
    root.style.setProperty('--font-size', `${t.fontSize}px`)
  }

  async function loadTheme() {
    try {
      const res = await getTheme()
      if (res.data && Object.keys(res.data).length) {
        theme.value = { ...defaultTheme, ...res.data }
      }
    } catch {
      theme.value = { ...defaultTheme }
    }
    applyCss(theme.value)
  }

  async function updateTheme(partial) {
    theme.value = { ...theme.value, ...partial }
    applyCss(theme.value)
    await saveTheme(theme.value)
  }

  function previewTheme(partial) {
    const next = { ...theme.value, ...partial }
    applyCss(next)
    theme.value = next
  }

  return { theme, loadTheme, updateTheme, previewTheme, defaultTheme }
})
