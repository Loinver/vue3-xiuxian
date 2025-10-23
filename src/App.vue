<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 底部导航栏 -->
    <van-tabbar v-model="active" fixed @update:model-value="onChange">
      <van-tabbar-item icon="wap-home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="upgrade" to="/realm">境界</van-tabbar-item>
      <van-tabbar-item icon="bag-o" to="/equipment">背包</van-tabbar-item>
      <van-tabbar-item icon="fire-o" to="/skill">技能</van-tabbar-item>
      <van-tabbar-item icon="fire-o" to="/battle">战斗</van-tabbar-item>
      <van-tabbar-item icon="setting-o" to="/settings">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const route = useRoute()
const active = ref(0)

// 根据路由更新激活标签
const updateActiveTab = () => {
  const pathMap: Record<string, number> = {
    '/': 0,
    '/realm': 1,
    '/equipment': 2,
    '/skill': 3,
    '/battle': 4,
    '/settings': 5,
  }
  active.value = pathMap[route.path] || 0
}

const onChange = (index: number) => {
  active.value = index
}

// 应用生命周期
onMounted(async () => {
  console.log('App Mounted')

  // 初始化游戏
  await gameStore.initGame()

  // 计算离线收益
  gameStore.calculateOfflineRewards()

  // 恢复挂机
  gameStore.resumeIdle()

  // 更新激活标签
  updateActiveTab()

  // 页面可见性监听
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 页面卸载前保存
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 页面可见性变化
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面隐藏 - 暂停挂机并保存
    if (gameStore.player) {
      gameStore.pauseIdle()
      gameStore.saveGame()
    }
  } else {
    // 页面显示 - 恢复挂机
    if (gameStore.player && !gameStore.isGameRunning) {
      gameStore.resumeIdle()
    }
  }
}

// 页面卸载前保存
const handleBeforeUnload = () => {
  if (gameStore.player) {
    gameStore.pauseIdle()
    gameStore.saveGame()
  }
}
</script>

<style>
/* 全局样式 - 移动端优化 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  overflow-x: hidden;
}

/* 禁用移动端双击缩放和文本选择 */
* {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 通用工具类 */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-center {
  text-align: center;
}

/* 装备稀有度颜色（13级）- 移动端优化 */
.rarity-凡品 { color: #aaa; }
.rarity-黄品 { color: #ffd700; font-weight: 500; }
.rarity-玄品 { color: #9370db; font-weight: 500; }
.rarity-地品 { color: #cd853f; font-weight: 500; }
.rarity-天品 { color: #87ceeb; font-weight: 500; }
.rarity-仙品 { color: #ff69b4; font-weight: 600; }
.rarity-神器 { color: #ff4500; font-weight: 600; }
.rarity-后天灵宝 { color: #ff6347; font-weight: bold; }
.rarity-后天至宝 { color: #ff1493; font-weight: bold; }
.rarity-先天灵宝 { color: #8b00ff; font-weight: bold; }
.rarity-先天至宝 { color: #9400d3; font-weight: bold; }
.rarity-混沌灵宝 {
  color: #ff00ff;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(255, 0, 255, 0.5);
}
.rarity-混沌至宝 {
  color: #ff0080;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(255, 0, 128, 0.5);
}

/* 技能稀有度颜色（6级）- 移动端优化 */
.rarity-黄阶 { color: #ffd700; font-weight: 500; }
.rarity-玄阶 { color: #9370db; font-weight: 500; }
.rarity-地阶 { color: #cd853f; font-weight: 500; }
.rarity-天阶 { color: #87ceeb; font-weight: 600; }
.rarity-仙阶 { color: #ff69b4; font-weight: 600; }
.rarity-神阶 {
  color: #ff4500;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(255, 69, 0, 0.5);
}

/* 底部导航栏适配 */
.van-tabbar {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
