<template>
  <div class="battle-page">
    <div class="card">
      <div class="card-title">当前地图</div>
      <div class="map-info">
        <div class="map-name">{{ currentMap?.name }}</div>
        <div class="map-desc">{{ currentMap?.description }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">怪物信息</div>
      <div class="monster-list">
        <div
          v-for="monster in currentMapMonsters"
          :key="monster.id"
          class="monster-item"
          :class="{ 'boss-item': monster.isBoss }"
          @click="showMonsterDetail(monster)"
        >
          <div class="monster-header">
            <div class="monster-name">
              <span v-if="monster.isBoss" class="boss-badge">Boss</span>
              {{ monster.name }}
            </div>
            <div class="monster-level">Lv.{{ monster.level }}</div>
          </div>
          <div class="monster-stats">
            <span class="monster-stat">生命: {{ formatNumber(monster.attributes.hpMax) }}</span>
            <span class="monster-stat">攻击: {{ monster.attributes.attack }}</span>
            <span class="monster-stat">防御: {{ monster.attributes.defense }}</span>
          </div>
          <div class="drop-rates">
            <div class="drop-title">掉落率:</div>
            <div class="drop-items">
              <span class="drop-item">装备 {{ formatRate(getDropRates(monster).equipmentRate) }}</span>
              <span class="drop-item">技能书 {{ formatRate(getDropRates(monster).skillBookRate) }}</span>
              <span v-if="monster.dropTable.enhanceStone" class="drop-item">
                强化石 {{ getDropRates(monster).enhanceStoneRange }}个
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">战斗统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ player?.battle.killCount || 0 }}</span>
          <span class="stat-label">击杀</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ player?.battle.deathCount || 0 }}</span>
          <span class="stat-label">死亡</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(player?.battle.totalDamage || 0) }}</span>
          <span class="stat-label">总伤害</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">选择地图</div>
      <div style="overflow-y: auto" class="map-list">
        <div
          v-for="(map, index) in availableMaps"
          :key="map.id"
          class="map-item"
          :class="{ active: index === player?.battle.currentMapIndex }"
          @click="handleMapChange(index)"
        >
          <div class="map-item-name">{{ map.name }}</div>
          <div class="map-item-desc">{{ map.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { gameConfig } from '@/config/gameConfig'
import type { MonsterConfig } from '@/types/game'
import UI from '@/utils/ui'

const gameStore = useGameStore()
const player = computed(() => gameStore.player)
const currentMap = computed(() => gameStore.currentMap)
const availableMaps = computed(() => gameStore.availableMaps)

// 获取当前地图的怪物列表
const currentMapMonsters = computed(() => {
  if (!currentMap.value) return []
  return gameConfig.monsters.filter(m => currentMap.value!.monsters.includes(m.id))
})

function formatNumber(num: number): string {
  if (num >= 100000000) return `${(num / 100000000).toFixed(2)}亿`
  if (num >= 10000) return `${(num / 10000).toFixed(2)}万`
  return num.toString()
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function getDropRates(monster: MonsterConfig) {
  return gameStore.getMonsterDropRates(monster)
}

function handleMapChange(index: number) {
  if (player.value) {
    player.value.battle.currentMapIndex = index
    gameStore.saveGame()
    UI.toast({ title: `切换到${availableMaps.value[index].name}`, icon: 'success' })
  }
}

async function showMonsterDetail(monster: MonsterConfig) {
  const dropRates = getDropRates(monster)
  const isBoss = monster.isBoss ? 'Boss怪物' : '普通怪物'

  const content = `${monster.name} (${isBoss})\n` +
    `等级: Lv.${monster.level}\n` +
    `\n属性:\n` +
    `生命: ${formatNumber(monster.attributes.hpMax)}\n` +
    `攻击: ${monster.attributes.attack}\n` +
    `防御: ${monster.attributes.defense}\n` +
    `速度: ${monster.attributes.speed}\n` +
    `暴击率: ${formatRate(monster.attributes.critRate)}\n` +
    `\n掉落奖励:\n` +
    `灵石: ${monster.dropTable.lingStone[0]}-${monster.dropTable.lingStone[1]}${monster.isBoss ? ' (×3)' : ''}\n` +
    `经验: ${monster.dropTable.experience[0]}-${monster.dropTable.experience[1]}${monster.isBoss ? ' (×3)' : ''}\n` +
    `悟道点: ${monster.dropTable.comprehensionPoint?.[0] || 0}-${monster.dropTable.comprehensionPoint?.[1] || 0}${monster.isBoss ? ' (×3)' : ''}\n` +
    `\n掉落概率:\n` +
    `装备: ${formatRate(dropRates.equipmentRate)} (${dropRates.equipmentCount}件)\n` +
    `技能书: ${formatRate(dropRates.skillBookRate)} (${dropRates.skillBookCount}本)\n` +
    (monster.dropTable.enhanceStone ? `强化石: ${formatRate(dropRates.enhanceStoneRate)} (${dropRates.enhanceStoneRange}个)${monster.isBoss ? ' (×3)' : ''}\n` : '')

  await UI.modal({
    title: '怪物详情',
    content,
    showCancel: false,
    confirmText: '确定'
  })
}
</script>

<style scoped>
.battle-page {
  min-height: 100vh;
  padding: 10px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #1a1a2e;
}

.map-info {
  text-align: center;
  padding: 10px 0;
}

.map-name {
  font-size: 16px;
  font-weight: bold;
  color: #f4a460;
  margin-bottom: 6px;
}

.map-desc {
  font-size: 12px;
  color: #666;
}

.monster-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monster-item {
  padding: 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  cursor: pointer;
  transition: all 0.3s;
}

.monster-item:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.boss-item {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-color: #f4a460;
  box-shadow: 0 2px 8px rgba(244, 164, 96, 0.3);
}

.monster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.monster-name {
  font-size: 14px;
  font-weight: bold;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.boss-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.monster-level {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
}

.monster-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.monster-stat {
  font-size: 11px;
  color: #666;
  background: rgba(0, 0, 0, 0.03);
  padding: 3px 6px;
  border-radius: 4px;
}

.drop-rates {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.drop-title {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.drop-items {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.drop-item {
  font-size: 11px;
  background: rgba(244, 164, 96, 0.15);
  color: #f4a460;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(244, 164, 96, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 12px;
  opacity: 0.9;
}

.map-item {
  padding: 10px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: #f5f5f5;
}

.map-item.active {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
}

.map-item-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.map-item-desc {
  font-size: 12px;
  opacity: 0.8;
}
</style>
