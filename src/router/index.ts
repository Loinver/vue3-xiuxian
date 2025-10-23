import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: () => import('@/pages/index/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/realm',
    name: 'Realm',
    component: () => import('@/pages/realm/realm.vue'),
    meta: { title: '境界突破' },
  },
  {
    path: '/equipment',
    name: 'Equipment',
    component: () => import('@/pages/equipment/equipment.vue'),
    meta: { title: '装备管理' },
  },
  {
    path: '/skill',
    name: 'Skill',
    component: () => import('@/pages/skill/skill.vue'),
    meta: { title: '技能管理' },
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('@/pages/battle/battle.vue'),
    meta: { title: '战斗' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/settings/settings.vue'),
    meta: { title: '设置' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || '修仙挂机游戏'
  next()
})

export default router
