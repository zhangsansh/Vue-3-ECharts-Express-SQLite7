import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/screen/map',
    children: [
      {
        path: 'screen/map',
        name: 'MapScreen',
        component: () => import('@/views/screen/MapScreen.vue'),
        meta: { title: '全国地图大屏' }
      },
      {
        path: 'screen/charts2',
        name: 'ChartScreen2',
        component: () => import('@/views/screen/ChartScreen2.vue'),
        meta: { title: '销量趋势大屏' }
      },
      {
        path: 'screen/charts3',
        name: 'ChartScreen3',
        component: () => import('@/views/screen/ChartScreen3.vue'),
        meta: { title: '结构分析大屏' }
      },
      {
        path: 'screen/charts4',
        name: 'ChartScreen4',
        component: () => import('@/views/screen/ChartScreen4.vue'),
        meta: { title: '效能监控大屏' }
      },
      {
        path: 'screen/region/:province',
        name: 'RegionScreen',
        component: () => import('@/views/screen/RegionScreen.vue'),
        meta: { title: '地区大屏' }
      },
      {
        path: 'ml/training',
        name: 'MLTraining',
        component: () => import('@/views/ml/Training.vue'),
        meta: { title: '训练监控' }
      },
      {
        path: 'ml/predict',
        name: 'MLPredict',
        component: () => import('@/views/ml/Predict.vue'),
        meta: { title: '销量预测' }
      },
      {
        path: 'admin/users',
        name: 'Users',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', roles: ['admin'] }
      },
      {
        path: 'admin/data',
        name: 'DataManage',
        component: () => import('@/views/admin/DataManage.vue'),
        meta: { title: '数据管理', roles: ['admin', 'analyst'] }
      },
      {
        path: 'admin/db',
        name: 'DbSettings',
        component: () => import('@/views/admin/DbSettings.vue'),
        meta: { title: '数据库设置', roles: ['admin'] }
      },
      {
        path: 'admin/theme',
        name: 'ThemeSettings',
        component: () => import('@/views/admin/ThemeSettings.vue'),
        meta: { title: '系统样式', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta.public) return next()
  const token = localStorage.getItem('token')
  if (!token) return next('/login')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (to.meta.roles && user && !to.meta.roles.includes(user.role) && user.role !== 'admin') {
    return next('/screen/map')
  }
  next()
})

export default router
