<template>
  <div class="equipment-page">
    <div class="card">
      <div class="card-title">装备栏</div>
      <div class="equipment-slots">
        <div
          v-for="(slot, key) in equipmentSlots"
          :key="key"
          class="slot-item"
          @click="handleSlotClick(key)"
        >
          <div class="slot-name">{{ slotNames[key] }}</div>
          <div v-if="player?.equipment[key]" class="equipped">
            <div class="eq-name" :class="`rarity-${player.equipment[key]?.rarity}`">
              {{ getEquipmentFullName(player.equipment[key]!) }}
            </div>
            <div class="eq-level">Lv.{{ player.equipment[key]?.level }}</div>
          </div>
          <div v-else class="empty">未装备</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">背包 ({{ player?.inventory.equipments.length }}/{{ player?.inventory.maxSize }})</div>
        <div class="batch-actions" v-if="player?.inventory.equipments.length">
          <button
            class="btn-select-all"
            size="mini"
            @click="handleSelectAll"
          >
            {{ isAllSelected ? '取消全选' : '全选' }}
          </button>
          <button
            class="btn-batch-sell"
            size="mini"
            :disabled="selectedEquipments.length === 0"
            @click="handleBatchSell"
          >
            批量出售({{ selectedEquipments.length }})
          </button>
        </div>
      </div>
      <div style="overflow-y: auto" class="inventory-list">
        <div
          v-for="(eq, index) in player?.inventory.equipments"
          :key="index"
          class="inventory-item"
          :class="{ 'selected': isEquipmentSelected(eq) }"
          @longpress="handleLongPress(eq)"
        >
          <div class="checkbox-wrapper" v-if="selectedEquipments.length > 0" @click.stop="handleCheckboxClick(eq)">
            <div class="checkbox" :class="{ 'checked': isEquipmentSelected(eq) }">
              <span v-if="isEquipmentSelected(eq)">✓</span>
            </div>
          </div>
          <div class="eq-info">
            <div class="eq-name" :class="`rarity-${eq.rarity}`">
              {{ getEquipmentFullName(eq) }}
              <span v-if="eq.enhanceLevel && eq.enhanceLevel > 0" class="enhance-level">+{{ eq.enhanceLevel }}</span>
            </div>
            <div class="eq-meta">
              <span>Lv.{{ eq.level }}</span>
              <span>{{ slotNames[eq.slot] }}</span>
            </div>
            <div class="eq-require">
              需求: {{ getRealmName(eq.requireRealm) }} {{ eq.requireRealmLevel }}层
            </div>
            <div class="eq-attrs">
              <span v-for="(value, key) in eq.attributes" :key="key" class="attr-tag">
                {{ getAttrName(key as string) }}+{{ formatAttrValue(key as string, value as number) }}
              </span>
            </div>
            <div class="eq-price">
              售价: {{ calculateSellPrice(eq) }} 灵石
            </div>
          </div>
          <div class="btn-group">
            <button
              class="btn-equip"
              :class="{ 'btn-disabled': !canEquip(eq) }"
              size="mini"
              @click="handleEquipClick(eq)"
            >
              {{ canEquip(eq) ? '装备' : '需求不足' }}
            </button>
            <button
              class="btn-sell"
              size="mini"
              @click="handleSellClick(eq)"
            >
              出售
            </button>
          </div>
        </div>
        <div v-if="!player?.inventory.equipments.length" class="empty-tip">
          背包空空如也
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { EquipmentSlot } from '@/types/game'
import type { Equipment } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'
import { calculateEquipmentSellPrice, getEquipmentFullName } from '@/utils/equipment'
import UI from '@/utils/ui'

const gameStore = useGameStore()
const player = computed(() => gameStore.player)

// 批量售出相关状态
const selectedEquipments = ref<Equipment[]>([])

// 是否全选
const isAllSelected = computed(() => {
  if (!player.value?.inventory.equipments.length) return false
  return selectedEquipments.value.length === player.value.inventory.equipments.length
})

// 检查装备是否被选中
function isEquipmentSelected(equipment: Equipment): boolean {
  return selectedEquipments.value.some(eq => eq.id === equipment.id)
}

// 处理长按事件（进入选择模式）
function handleLongPress(equipment: Equipment) {
  if (selectedEquipments.value.length === 0) {
    selectedEquipments.value.push(equipment)
    UI.toast({ title: '已进入选择模式', icon: 'none' })
  }
}

// 处理复选框点击
function handleCheckboxClick(equipment: Equipment) {
  const index = selectedEquipments.value.findIndex(eq => eq.id === equipment.id)
  if (index > -1) {
    selectedEquipments.value.splice(index, 1)
  } else {
    selectedEquipments.value.push(equipment)
  }
}

// 全选/取消全选
function handleSelectAll() {
  if (isAllSelected.value) {
    selectedEquipments.value = []
  } else {
    selectedEquipments.value = [...(player.value?.inventory.equipments || [])]
  }
}

// 批量出售
async function handleBatchSell() {
  if (selectedEquipments.value.length === 0) {
    UI.toast({ title: '请先选择要出售的装备', icon: 'none' })
    return
  }

  // 计算总售价
  const totalPrice = selectedEquipments.value.reduce((sum, eq) => {
    return sum + calculateEquipmentSellPrice(eq)
  }, 0)

  // 构建确认信息
  const rarityGroups: Record<string, number> = {}
  selectedEquipments.value.forEach(eq => {
    rarityGroups[eq.rarity] = (rarityGroups[eq.rarity] || 0) + 1
  })

  const groupInfo = Object.entries(rarityGroups)
    .map(([rarity, count]) => `${rarity}×${count}`)
    .join('、')

  const content = `共选择 ${selectedEquipments.value.length} 件装备\n${groupInfo}\n\n总售价: ${gameStore.formatNumber(totalPrice)} 灵石`

  const res = await UI.modal({
    title: '批量出售确认',
    content,
    confirmText: '出售',
    cancelText: '取消'
  })

  if (res.confirm) {
    // 执行批量出售
    const count = selectedEquipments.value.length
    let totalSellPrice = 0

    selectedEquipments.value.forEach(eq => {
      totalSellPrice += gameStore.sellEquipment(eq)
    })

    // 清空选择
    selectedEquipments.value = []

    UI.toast({
      title: `出售成功！获得${gameStore.formatNumber(totalSellPrice)}灵石`,
      icon: 'success',
      duration: 2000
    })
  }
}

const equipmentSlots = {
  [EquipmentSlot.WEAPON]: null,
  [EquipmentSlot.ARMOR]: null,
  [EquipmentSlot.HELMET]: null,
  [EquipmentSlot.BOOTS]: null,
  [EquipmentSlot.RING]: null,
  [EquipmentSlot.NECKLACE]: null
}

const slotNames = {
  [EquipmentSlot.WEAPON]: '武器',
  [EquipmentSlot.ARMOR]: '护甲',
  [EquipmentSlot.HELMET]: '头盔',
  [EquipmentSlot.BOOTS]: '鞋子',
  [EquipmentSlot.RING]: '戒指',
  [EquipmentSlot.NECKLACE]: '项链'
}

// 属性名称映射
const attrNameMap: Record<string, string> = {
  hpMax: '生命',
  mpMax: '法力',
  attack: '攻击',
  defense: '防御',
  speed: '速度',
  critRate: '暴击率',
  critDamage: '暴伤',
  dodge: '闪避',
  block: '格挡'
}

// 获取境界名称
function getRealmName(realmIndex: number): string {
  return gameConfig.realms[realmIndex]?.name || '未知境界'
}

// 获取属性名称
function getAttrName(key: string): string {
  return attrNameMap[key] || key
}

// 格式化属性值
function formatAttrValue(key: string, value: number): string {
  // 百分比属性
  if (['critRate', 'critDamage', 'dodge', 'block'].includes(key)) {
    return `${(value * 100).toFixed(1)}%`
  }
  // 整数属性
  return Math.floor(value).toString()
}

// 计算装备售价
function calculateSellPrice(equipment: Equipment): string {
  const sellPrice = calculateEquipmentSellPrice(equipment)
  return gameStore.formatNumber(sellPrice)
}

// 检查是否可以装备
function canEquip(equipment: Equipment): boolean {
  if (!player.value) return false
  const realm = player.value.realm
  return realm.realmIndex > equipment.requireRealm ||
    (realm.realmIndex === equipment.requireRealm && realm.level >= equipment.requireRealmLevel)
}

async function handleSlotClick(slot: string) {
  const equipped = player.value?.equipment[slot as EquipmentSlot]
  if (equipped) {
    // 构建装备详情信息
    const attrs = Object.entries(equipped.attributes)
      .map(([key, value]) => `${getAttrName(key)}+${formatAttrValue(key, value as number)}`)
      .join('\n')

    const details = `${getEquipmentFullName(equipped)}\n` +
      `等级: Lv.${equipped.level}\n` +
      `稀有度: ${equipped.rarity}\n` +
      `品质: ${equipped.quality}\n` +
      `需求: ${getRealmName(equipped.requireRealm)} ${equipped.requireRealmLevel}层\n` +
      `\n属性:\n${attrs}`

    const res = await UI.modal({
      title: '装备详情',
      content: details,
      confirmText: '卸下',
      cancelText: '取消'
    })

    if (res.confirm && player.value) {
      // 检查背包容量
      if (player.value.inventory.equipments.length >= player.value.inventory.maxSize) {
        UI.toast({ title: '背包已满', icon: 'none' })
        return
      }

      // 卸下装备逻辑
      player.value.inventory.equipments.push(equipped)
      player.value.equipment[slot as EquipmentSlot] = null
      gameStore.saveGame()
      UI.toast({ title: '已卸下', icon: 'success' })
    }
  }
}

// 比较装备属性差异
function compareEquipments(newEq: Equipment, currentEq: Equipment | null): string {
  if (!currentEq) {
    return '\n新装备属性:\n' + Object.entries(newEq.attributes)
      .map(([key, value]) => `${getAttrName(key)}+${formatAttrValue(key, value as number)}`)
      .join('\n')
  }

  let comparison = '\n属性对比:\n'
  const allKeys = new Set([
    ...Object.keys(newEq.attributes),
    ...Object.keys(currentEq.attributes)
  ])

  allKeys.forEach(key => {
    const newValue = (newEq.attributes as any)[key] || 0
    const currentValue = (currentEq.attributes as any)[key] || 0
    const diff = newValue - currentValue

    if (diff !== 0) {
      const arrow = diff > 0 ? '↑' : '↓'
      const color = diff > 0 ? '+' : ''
      comparison += `${getAttrName(key)}: ${formatAttrValue(key, currentValue)} → ${formatAttrValue(key, newValue)} (${color}${formatAttrValue(key, Math.abs(diff))}${arrow})\n`
    } else if (newValue !== 0) {
      comparison += `${getAttrName(key)}: ${formatAttrValue(key, newValue)} (无变化)\n`
    }
  })

  return comparison
}

function handleEquipClick(equipment: Equipment) {
  if (!player.value) return

  // 检查境界要求
  const realm = player.value.realm
  if (realm.realmIndex < equipment.requireRealm ||
    (realm.realmIndex === equipment.requireRealm && realm.level < equipment.requireRealmLevel)) {
    UI.toast({
      title: '境界不足',
      icon: 'none'
    })
    return
  }

  // 获取当前装备的部位装备
  const currentEquipped = player.value.equipment[equipment.slot]

  // 显示对比信息
  showEquipCompareDialog(equipment, currentEquipped)
}

async function showEquipCompareDialog(newEquipment: Equipment, currentEquipment: Equipment | null) {
  if (!player.value) return

  const enhanceText = newEquipment.enhanceLevel ? ` +${newEquipment.enhanceLevel}` : ''
  const currentEnhanceText = currentEquipment?.enhanceLevel ? ` +${currentEquipment.enhanceLevel}` : ''

  let content = `新装备: ${getEquipmentFullName(newEquipment)}${enhanceText}\n` +
    `等级: Lv.${newEquipment.level}\n` +
    `稀有度: ${newEquipment.rarity}\n` +
    `品质: ${newEquipment.quality}\n`

  if (currentEquipment) {
    content += `\n当前装备: ${getEquipmentFullName(currentEquipment)}${currentEnhanceText}\n` +
      `等级: Lv.${currentEquipment.level}\n` +
      `稀有度: ${currentEquipment.rarity}\n` +
      `品质: ${currentEquipment.quality}\n`
  }

  content += compareEquipments(newEquipment, currentEquipment)

  const res = await UI.modal({
    title: '装备对比',
    content,
    confirmText: '装备',
    cancelText: '取消'
  })

  if (res.confirm) {
    // 装备逻辑
    if (currentEquipment) {
      player.value!.inventory.equipments.push(currentEquipment)
    }

    player.value!.equipment[newEquipment.slot] = newEquipment
    const index = player.value!.inventory.equipments.findIndex(eq => eq.id === newEquipment.id)
    if (index > -1) {
      player.value!.inventory.equipments.splice(index, 1)
    }

    gameStore.saveGame()
    UI.toast({ title: '装备成功', icon: 'success' })
  }
}

async function handleSellClick(equipment: Equipment) {
  if (!player.value) return

  // 构建装备信息
  const attrs = Object.entries(equipment.attributes)
    .map(([key, value]) => `${getAttrName(key)}+${formatAttrValue(key, value as number)}`)
    .join('\n')

  const details = `${getEquipmentFullName(equipment)}\n` +
    `等级: Lv.${equipment.level}\n` +
    `稀有度: ${equipment.rarity}\n` +
    `品质: ${equipment.quality}\n` +
    `\n属性:\n${attrs}\n` +
    `\n售价: ${calculateSellPrice(equipment)} 灵石`

  const res = await UI.modal({
    title: '确认出售',
    content: details,
    confirmText: '出售',
    cancelText: '取消'
  })

  if (res.confirm) {
    const sellPrice = gameStore.sellEquipment(equipment)
    UI.toast({
      title: `出售成功,获得${gameStore.formatNumber(sellPrice)}灵石`,
      icon: 'success',
      duration: 2000
    })
  }
}
</script>

<style scoped>
.equipment-page {
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
  color: #1a1a2e;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.batch-actions {
  display: flex;
  gap: 4px;
}

.btn-select-all,
.btn-batch-sell {
  font-size: 11px;
  padding: 6px 10px;
  min-width: 50px;
  border-radius: 3px;
  border: none;
  color: white;
  cursor: pointer;
  line-height: 1.2;
}

.btn-select-all {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.btn-batch-sell {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
}

.btn-batch-sell[disabled] {
  opacity: 0.5;
  background: #ccc;
}


.equipment-slots {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.slot-item {
  padding: 10px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  text-align: center;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.slot-item:active {
  transform: scale(0.98);
  border-color: #f4a460;
}

.slot-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.equipped {
  margin-top: 3px;
}

.eq-name {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 2px;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 4px;
}

.enhance-level {
  display: inline-block;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: bold;
}

.eq-level {
  font-size: 12px;
  color: #666;
}

.empty {
  font-size: 12px;
  color: #999;
}


.inventory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  position: relative;
}

.inventory-item.selected {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #f4a460;
  box-shadow: 0 2px 8px rgba(244, 164, 96, 0.3);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding-right: 6px;
  flex-shrink: 0;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid #f4a460;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.3s;
}

.checkbox.checked {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  border-color: #ff8c42;
}

.checkbox text {
  color: white;
  font-size: 12px;
  font-weight: bold;
}


.inventory-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.eq-info {
  flex: 1;
  padding-right: 6px;
  min-width: 0;
}

.eq-meta {
  font-size: 12px;
  color: #666;
  margin-top: 3px;
  display: flex;
  gap: 6px;
}

.eq-require {
  font-size: 11px;
  color: #999;
  margin-top: 3px;
}

.eq-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.eq-price {
  font-size: 12px;
  color: #f4a460;
  font-weight: bold;
  margin-top: 4px;
  background: rgba(244, 164, 96, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
  display: inline-block;
}

.attr-tag {
  font-size: 11px;
  padding: 2px 4px;
  background: rgba(244, 164, 96, 0.12);
  color: #f4a460;
  border-radius: 3px;
  border: 1px solid rgba(244, 164, 96, 0.25);
  white-space: nowrap;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.btn-equip,
.btn-sell {
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  flex-shrink: 0;
  font-size: 12px;
  min-width: 54px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  line-height: 1.2;
}

.btn-equip {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
}

.btn-equip:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.btn-sell {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.btn-sell:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.btn-disabled {
  background: #ccc !important;
  opacity: 0.6;
  box-shadow: none;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 11px;
}

</style>
