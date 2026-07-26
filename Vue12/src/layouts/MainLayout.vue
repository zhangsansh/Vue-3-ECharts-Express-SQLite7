<template>
  <div class="layout" :class="{ 'is-screen': isScreen }">
    <aside v-if="!isScreen" class="sider">
      <div class="sider-logo">
        <span class="dot"></span>
        <div>
          <strong>NEV · ML</strong>
          <small>销量数据分析</small>
        </div>
      </div>
      <el-menu :default-active="route.path" router background-color="transparent" text-color="#cde" active-text-color="#00d4ff">
        <el-menu-item-group title="可视化大屏">
          <el-menu-item index="/screen/map">全国地图</el-menu-item>
          <el-menu-item index="/screen/charts2">趋势分析</el-menu-item>
          <el-menu-item index="/screen/charts3">结构分析</el-menu-item>
          <el-menu-item index="/screen/charts4">效能监控</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="机器学习">
          <el-menu-item index="/ml/training">训练监控</el-menu-item>
          <el-menu-item index="/ml/predict">销量预测</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group v-if="userStore.canEdit || userStore.isAdmin" title="系统管理">
          <el-menu-item v-if="userStore.isAdmin" index="/admin/users">用户管理</el-menu-item>
          <el-menu-item v-if="userStore.canEdit" index="/admin/data">数据管理</el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/admin/db">数据库设置</el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/admin/theme">系统样式</el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </aside>

    <div class="main">
      <header class="header" :class="{ 'header-screen': isScreen }">
        <div class="left">
          <el-button v-if="isScreen" text style="color: var(--accent)" @click="showNav = !showNav">
            <el-icon><Menu /></el-icon>
          </el-button>
          <h2>{{ pageTitle }}</h2>
        </div>
        <div class="center" v-if="isScreen">
          <nav class="screen-nav">
            <router-link to="/screen/map">地图</router-link>
            <router-link to="/screen/charts2">趋势</router-link>
            <router-link to="/screen/charts3">结构</router-link>
            <router-link to="/screen/charts4">效能</router-link>
            <router-link to="/ml/training">训练</router-link>
            <router-link to="/ml/predict">预测</router-link>
          </nav>
        </div>
        <div class="right">
          <span class="clock">{{ now }}</span>
          <el-dropdown>
            <span class="user-entry">
              {{ userStore.user?.nickname || userStore.user?.username }}
              <small>({{ userStore.roleLabel }})</small>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="!isScreen" @click="$router.push('/screen/map')">进入大屏</el-dropdown-item>
                <el-dropdown-item v-if="isScreen" @click="$router.push('/admin/data')">管理后台</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" @click="$router.push('/admin/theme')">系统样式</el-dropdown-item>
                <el-dropdown-item divided @click="onLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <Transition name="slide">
        <div v-if="isScreen && showNav" class="float-nav panel" @click.stop>
          <router-link v-for="item in menuLinks" :key="item.to" :to="item.to" @click="showNav = false">
            {{ item.label }}
          </router-link>
        </div>
      </Transition>
      <div v-if="isScreen && showNav" class="float-mask" @click="showNav = false"></div>

      <main class="content" :class="{ 'content-screen': isScreen }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const now = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const showNav = ref(false)
let timer

const isScreen = computed(() => route.path.startsWith('/screen'))
const pageTitle = computed(() => {
  if (route.name === 'RegionScreen') return '地区销量大屏'
  return route.meta.title || themeStore.theme.screenTitle
})

const menuLinks = computed(() => {
  const list = [
    { to: '/screen/map', label: '全国地图' },
    { to: '/screen/charts2', label: '趋势分析' },
    { to: '/screen/charts3', label: '结构分析' },
    { to: '/screen/charts4', label: '效能监控' },
    { to: '/ml/training', label: '训练监控' },
    { to: '/ml/predict', label: '销量预测' }
  ]
  if (userStore.canEdit) list.push({ to: '/admin/data', label: '数据管理' })
  if (userStore.isAdmin) {
    list.push(
      { to: '/admin/users', label: '用户管理' },
      { to: '/admin/db', label: '数据库设置' },
      { to: '/admin/theme', label: '系统样式' }
    )
  }
  return list
})

async function onLogout() {
  await userStore.logout()
  router.push('/login')
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-gradient);
}
.layout.is-screen { display: block; }
.sider {
  width: 220px;
  background: rgba(6, 18, 36, 0.95);
  border-right: 1px solid var(--border);
  padding: 12px 0;
  flex-shrink: 0;
}
.sider-logo {
  display: flex; gap: 10px; align-items: center;
  padding: 8px 18px 18px; color: #fff;
}
.sider-logo .dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 12px var(--accent);
}
.sider-logo strong { display: block; font-size: 15px; }
.sider-logo small { color: #8ab; font-size: 12px; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.header {
  height: 56px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 18px; border-bottom: 1px solid var(--border);
  background: rgba(8, 20, 40, 0.65); backdrop-filter: blur(8px);
}
.header-screen {
  background: transparent; border: none;
  position: absolute; left: 0; right: 0; top: 0; z-index: 20;
}
.left { display: flex; align-items: center; gap: 8px; max-width: 28%; min-width: 0; }
.left h2 {
  font-size: 18px; font-weight: 700; letter-spacing: 1px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.center { position: absolute; left: 50%; transform: translateX(-50%); z-index: 1; }
.screen-nav { display: flex; gap: 18px; }
.screen-nav a {
  color: rgba(232, 241, 255, 0.7); font-size: 14px; padding: 4px 2px;
  border-bottom: 2px solid transparent;
}
.screen-nav a.router-link-active { color: var(--accent); border-color: var(--accent); }
.right { display: flex; align-items: center; gap: 16px; max-width: 32%; justify-content: flex-end; }
.clock { color: var(--accent); font-variant-numeric: tabular-nums; font-size: 13px; }
.user-entry { cursor: pointer; color: var(--text); font-size: 13px; }
.user-entry small { color: #8ab; margin-left: 4px; }
.content { flex: 1; padding: 16px; overflow: auto; }
.content-screen { padding: 0; overflow: hidden; height: 100vh; }

.float-mask { position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,0.35); }
.float-nav {
  position: fixed; left: 16px; top: 64px; z-index: 40;
  padding: 12px; display: flex; flex-direction: column; gap: 8px; min-width: 160px;
}
.float-nav a { padding: 8px 10px; border-radius: 6px; color: var(--text); }
.float-nav a:hover, .float-nav a.router-link-active { background: rgba(0,212,255,0.15); color: var(--accent); }
.slide-enter-active, .slide-leave-active { transition: all 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

:deep(.el-menu) { border-right: none; }
:deep(.el-menu-item-group__title) { color: #6a8aa8 !important; }
</style>
