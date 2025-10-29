<template>
  <div class="index-page">
    <!-- 顶部信息栏 -->
    <div class="header">
      <div class="player-info">
        <span class="player-name">{{ gameStore.player?.name }}</span>
        <span class="player-realm">{{ realmText }}</span>
      </div>
      <div class="resources">
        <div class="resource-item">
          <span class="icon">💎</span>
          <span>{{ formatNumber(gameStore.player?.resources.lingStone || 0) }}</span>
        </div>
        <div class="resource-item" @click="handleGM">
          <span class="icon" >✨</span>
          <span>{{ gameStore.player?.resources.comprehensionPoint || 0 }}</span>
        </div>
        <div class="resource-item">
          <span class="icon">🔨</span>
          <span>{{ gameStore.player?.resources.enhanceStone || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 角色状态 -->
    <div class="card">
      <div class="card-title">角色状态</div>
      <div class="attr-item">
        <span>生命:</span>
        <span class="attr-value">{{ Math.floor(gameStore.player?.attributes.hp || 0) }} / {{ Math.floor(gameStore.player?.attributes.hpMax || 0) }}</span>
      </div>
      <div class="progress">
        <div class="progress-bar" :style="{ width: hpPercent + '%' }">{{ hpPercent }}%</div>
      </div>

      <div class="attr-item mt-10">
        <span>法力:</span>
        <span class="attr-value">{{ Math.floor(gameStore.player?.attributes.mp || 0) }} / {{ Math.floor(gameStore.player?.attributes.mpMax || 0) }}</span>
      </div>
      <div class="progress">
        <div class="progress-bar mp-bar" :style="{ width: mpPercent + '%' }">{{ mpPercent }}%</div>
      </div>

      <div class="attr-item mt-10">
        <span>攻击:</span>
        <span class="attr-value">{{ Math.floor(gameStore.totalAttributes?.attack || 0) }}</span>
      </div>
      <div class="attr-item">
        <span>防御:</span>
        <span class="attr-value">{{ Math.floor(gameStore.totalAttributes?.defense || 0) }}</span>
      </div>
      <div class="attr-item">
        <span>速度:</span>
        <span class="attr-value">{{ Math.floor(gameStore.totalAttributes?.speed || 0) }}</span>
      </div>
      <div class="attr-item">
        <span>暴击率:</span>
        <span class="attr-value">{{ ((gameStore.totalAttributes?.critRate || 0) * 100).toFixed(1) }}%</span>
      </div>
      <div class="attr-item">
        <span>暴击伤害:</span>
        <span class="attr-value">{{ ((gameStore.totalAttributes?.critDamage || 0) * 100).toFixed(1) }}%</span>
      </div>
      <div class="attr-item">
        <span>闪避:</span>
        <span class="attr-value">{{ ((gameStore.totalAttributes?.dodge || 0) * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <!-- 修炼进度 -->
    <div class="card">
      <div class="card-title">修炼进度</div>
      <div class="attr-item">
        <span>修为:</span>
        <span class="attr-value">
          {{ formatNumber(gameStore.player?.realm.cultivation || 0) }} /
          {{ formatNumber(gameStore.player?.realm.cultivationMax || 0) }}
        </span>
      </div>
      <div class="progress">
        <div class="progress-bar" :style="{ width: cultivationPercent + '%' }">
          {{ cultivationPercent }}%
        </div>
      </div>

      <button
        class="btn btn-primary mt-10"
        :disabled="!canBreakthrough"
        @click="handleBreakthrough"
      >
        {{ breakthroughText }}
      </button>
    </div>
    <!-- 战斗日志 -->
    <div class="card">
      <div class="card-title">战斗日志</div>
      <div style="overflow-y: auto" class="battle-log">
        <div
          v-for="(log, index) in gameStore.battleLog.slice(-10).reverse()"
          :key="index"
          class="log-item"
        >
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import UI from '@/utils/ui'

const gameStore = useGameStore()

const autoMeditate = computed(() => gameStore.player?.battle.autoMeditate ?? false)
const autoBattle = computed(() => gameStore.player?.battle.autoBattle ?? false)

const realmText = computed(() => {
  if (!gameStore.player || !gameStore.currentRealm) return ''
  const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
  return `${gameStore.currentRealm.name} ${levelNames[gameStore.player.realm.level - 1]}层`
})

const hpPercent = computed(() => {
  if (!gameStore.player) return 0
  return Math.floor((gameStore.player.attributes.hp / gameStore.player.attributes.hpMax) * 100)
})

const mpPercent = computed(() => {
  if (!gameStore.player) return 0
  return Math.floor((gameStore.player.attributes.mp / gameStore.player.attributes.mpMax) * 100)
})

const cultivationPercent = computed(() => {
  if (!gameStore.player) return 0
  return Math.floor((gameStore.player.realm.cultivation / gameStore.player.realm.cultivationMax) * 100)
})

const canBreakthrough = computed(() => {
  if (!gameStore.player || !gameStore.currentRealm) return false
  return gameStore.player.realm.cultivation >= gameStore.player.realm.cultivationMax &&
    gameStore.player.resources.lingStone >= gameStore.currentRealm.breakthroughCost
})

const breakthroughText = computed(() => {
  if (!gameStore.currentRealm) return '突破'
  return `突破 (消耗${formatNumber(gameStore.currentRealm.breakthroughCost)}灵石)`
})

function formatNumber(num: number): string {
  num = Math.floor(num) // 确保是整数
  if (num >= 100000000) {
    const value = num / 100000000
    return value % 1 === 0 ? `${value}亿` : `${value.toFixed(2)}亿`
  }
  if (num >= 10000) {
    const value = num / 10000
    return value % 1 === 0 ? `${value}万` : `${value.toFixed(2)}万`
  }
  return num.toString()
}

function handleBreakthrough() {
  const result = gameStore.breakthrough()
  UI.toast({
    title: result.message,
    icon: result.success ? 'success' : 'none',
    duration: 2000
  })
}

const handleGM = () => {
  gameStore.GM()
}

function toggleMeditate(value: boolean) {
  if (gameStore.player) {
    gameStore.player.battle.autoMeditate = value
    gameStore.pauseIdle()
    gameStore.resumeIdle()
    gameStore.saveGame()
  }
}

function toggleBattle(value: boolean) {
  if (gameStore.player) {
    gameStore.player.battle.autoBattle = value
    gameStore.pauseIdle()
    gameStore.resumeIdle()
    gameStore.saveGame()
  }
}

onMounted(() => {
  // 页面挂载时确保游戏已初始化
  if (!gameStore.player) {
    gameStore.initGame()
  }
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  padding-bottom: 50px;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
  padding: 12px 10px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(244, 164, 96, 0.3);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 14px;
  font-weight: bold;
  display: block;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-realm {
  font-size: 11px;
  opacity: 0.95;
  display: block;
}

.resources {
  display: flex;
  gap: 4px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 8px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

.icon {
  font-size: 11px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 10px;
  margin: 8px 8px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #1a1a2e;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.attr-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.attr-item:last-child {
  border-bottom: none;
}

.attr-value {
  color: #f4a460;
  font-weight: bold;
  font-size: 13px;
  flex-shrink: 0;
  margin-left: 8px;
  text-align: right;
}

.progress {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin-top: 4px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f4a460 0%, #ff8c42 100%);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
  box-shadow: inset 0 -1px 4px rgba(0, 0, 0, 0.1);
}

.mp-bar {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
}

.btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(244, 164, 96, 0.3);
  cursor: pointer;
  line-height: 1.4;
}

.btn-primary {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
}

.btn-primary:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  box-shadow: none;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 11px;
}

.mt-10 {
  margin-top: 8px;
}

.mb-10 {
  margin-bottom: 8px;
}

.battle-log {
  height: 200px;
  font-size: 10px;
  color: #666;
  background: #f8f9fa;
  padding: 6px;
  border-radius: 6px;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #e9ecef;
  line-height: 1.5;
}

.log-item:last-child {
  border-bottom: none;
}
</style>
