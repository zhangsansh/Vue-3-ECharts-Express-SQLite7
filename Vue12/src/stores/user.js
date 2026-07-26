import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getMe, logout as logoutApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLogin = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const canEdit = computed(() => ['admin', 'analyst'].includes(user.value?.role))
  const roleLabel = computed(() => {
    const map = { admin: '管理员', analyst: '分析师', viewer: '访客', user: '普通用户' }
    return map[user.value?.role] || user.value?.role
  })

  async function login(payload) {
    const res = await loginApi(payload)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
    return res
  }

  async function fetchMe() {
    if (!token.value) return null
    const res = await getMe()
    user.value = res.data
    localStorage.setItem('user', JSON.stringify(user.value))
    return res.data
  }

  async function logout() {
    try { await logoutApi() } catch { /* ignore */ }
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLogin, isAdmin, canEdit, roleLabel, login, fetchMe, logout }
})
