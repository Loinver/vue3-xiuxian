<template>
  <div class="realm-page">
    <div class="card">
      <div class="card-title">当前境界</div>
      <div class="realm-info">
        <div class="realm-name">{{ currentRealm?.name }}</div>
        <div class="realm-level">第{{ levelText }}层</div>
      </div>

      <div class="attr-grid">
        <div class="attr-card">
          <span class="attr-label">生命</span>
          <span class="attr-value">{{ Math.floor(player?.attributes.hpMax || 0) }}</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">法力</span>
          <span class="attr-value">{{ Math.floor(player?.attributes.mpMax || 0) }}</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">攻击</span>
          <span class="attr-value">{{ Math.floor(totalAttributes?.attack || 0) }}</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">防御</span>
          <span class="attr-value">{{ Math.floor(totalAttributes?.defense || 0) }}</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">速度</span>
          <span class="attr-value">{{ Math.floor(totalAttributes?.speed || 0) }}</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">暴击率</span>
          <span class="attr-value">{{ ((totalAttributes?.critRate || 0) * 100).toFixed(1) }}%</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">暴击伤害</span>
          <span class="attr-value">{{ ((totalAttributes?.critDamage || 0) * 100).toFixed(1) }}%</span>
        </div>
        <div class="attr-card">
          <span class="attr-label">闪避</span>
          <span class="attr-value">{{ ((totalAttributes?.dodge || 0) * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">境界列表</div>
      <div style="overflow-y: auto" class="realm-list">
        <div
          v-for="(realm, index) in realms"
          :key="realm.id"
          class="realm-item"
          :class="{ active: index === player?.realm.realmIndex, locked: index > player?.realm.realmIndex }"
        >
          <div class="realm-item-name">{{ realm.name }}</div>
          <div class="realm-item-desc">{{ index === player?.realm.realmIndex ? '当前境界' : index < player?.realm.realmIndex ? '已突破' : '未解锁' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { gameConfig } from '@/config/gameConfig'

const gameStore = useGameStore()
const player = computed(() => gameStore.player)
const currentRealm = computed(() => gameStore.currentRealm)
const totalAttributes = computed(() => gameStore.totalAttributes)
const realms = gameConfig.realms

const levelText = computed(() => {
  if (!player.value) return ''
  const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
  return levelNames[player.value.realm.level - 1]
})
</script>

<style scoped>
.realm-page {
  min-height: 100vh;
  padding: 8px;
  padding-bottom: 50px;
  background: #f5f7fa;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
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

.realm-info {
  text-align: center;
  padding: 15px 0 12px;
  background: linear-gradient(135deg, rgba(244, 164, 96, 0.08) 0%, rgba(255, 140, 66, 0.08) 100%);
  border-radius: 6px;
  margin-bottom: 10px;
}

.realm-name {
  font-size: 18px;
  font-weight: bold;
  color: #f4a460;
  margin-bottom: 5px;
  text-shadow: 0 1px 4px rgba(244, 164, 96, 0.3);
}

.realm-level {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.attr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.attr-card {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  color: white;
  box-shadow: 0 2px 6px rgba(244, 164, 96, 0.3);
  transition: all 0.3s;
}

.attr-card:active {
  transform: scale(0.98);
}

.attr-label {
  display: block;
  font-size: 10px;
  opacity: 0.9;
  margin-bottom: 4px;
  font-weight: 500;
}

.attr-value {
  display: block;
  font-size: 14px;
  font-weight: bold;
}


.realm-item {
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 5px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  transition: all 0.3s;
  border: 1px solid transparent;
}

.realm-item:active {
  transform: scale(0.98);
}

.realm-item.active {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(244, 164, 96, 0.4);
  border-color: #f4a460;
}

.realm-item.locked {
  opacity: 0.5;
}

.realm-item-name {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 3px;
}

.realm-item-desc {
  font-size: 10px;
  opacity: 0.85;
  font-weight: 500;
}
</style>
