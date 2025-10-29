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
              <span v-if="player.equipment[key]?.enhanceLevel && player.equipment[key]!.enhanceLevel > 0" class="enhance-level">+{{ player.equipment[key]?.enhanceLevel }}</span>
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
            class="btn-batch-sell-by-quality"
            size="mini"
            @click="handleBatchSellByQuality"
          >
            按品质出售
          </button>
          <button
            class="btn-batch-sell-by-rarity"
            size="mini"
            @click="handleBatchSellByRarity"
          >
            按稀有度出售
          </button>
          <button
            class="btn-batch-sell-by-realm"
            size="mini"
            @click="handleBatchSellByRealm"
          >
            按需求境界
          </button>

        </div>
      </div>
      <div style="overflow-y: auto" class="inventory-list">
        <div
          v-for="(eq, index) in player?.inventory.equipments"
          :key="eq.id"
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
              class="btn-enhance"
              size="mini"
              @click="handleEnhanceClick(eq)"
            >
              强化
            </button>
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

    <!-- 品质选择弹窗 -->
    <van-popup v-model:show="showQualitySelector" position="bottom" round>
      <div class="selector-popup">
        <div class="selector-header">
          <span class="selector-title">选择品质</span>
          <button class="selector-cancel" @click="showQualitySelector = false">取消</button>
        </div>
        <div class="selector-body">
          <van-checkbox-group v-model="selectedQualities">
            <van-cell-group inset>
              <van-cell
                v-for="quality in availableQualities"
                :key="quality.value"
                clickable
                @click="toggleQuality(quality.value)"
              >
                <template #title>
                  <span>{{ quality.label }} ({{ quality.count }}件)</span>
                </template>
                <template #right-icon>
                  <van-checkbox
                    :name="quality.value"
                    @click.stop
                  />
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
        <div class="selector-footer">
          <button class="btn-confirm" @click="confirmQualitySelection">确定</button>
        </div>
      </div>
    </van-popup>

    <!-- 稀有度选择弹窗 -->
    <van-popup v-model:show="showRaritySelector" position="bottom" round>
      <div class="selector-popup">
        <div class="selector-header">
          <span class="selector-title">选择稀有度</span>
          <button class="selector-cancel" @click="showRaritySelector = false">取消</button>
        </div>
        <div class="selector-body">
          <van-checkbox-group v-model="selectedRarities">
            <van-cell-group inset>
              <van-cell
                v-for="rarity in availableRarities"
                :key="rarity.value"
                clickable
                @click="toggleRarity(rarity.value)"
              >
                <template #title>
                  <span>{{ rarity.label }} ({{ rarity.count }}件)</span>
                </template>
                <template #right-icon>
                  <van-checkbox
                    :name="rarity.value"
                    @click.stop
                  />
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
        <div class="selector-footer">
          <button class="btn-confirm" @click="confirmRaritySelection">确定</button>
        </div>
      </div>
    </van-popup>

    <!-- 需求等级选择弹窗 -->
    <van-popup v-model:show="showRealmSelector" position="bottom" round>
      <div class="selector-popup">
        <div class="selector-header">
          <span class="selector-title">选择需求境界</span>
          <button class="selector-cancel" @click="showRealmSelector = false">取消</button>
        </div>
        <div class="selector-body">
          <van-checkbox-group v-model="selectedRealms">
            <van-cell-group inset>
              <van-cell
                v-for="realm in availableRealms"
                :key="realm.value"
                clickable
                @click="toggleRealm(realm.value)"
              >
                <template #title>
                  <span>{{ realm.label }} ({{ realm.count }}件)</span>
                </template>
                <template #right-icon>
                  <van-checkbox
                    :name="realm.value"
                    @click.stop
                  />
                </template>
              </van-cell>
            </van-cell-group>
          </van-checkbox-group>
        </div>
        <div class="selector-footer">
          <button class="btn-confirm" @click="confirmRealmSelection">确定</button>
        </div>
      </div>
    </van-popup>
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

// 品质/稀有度/需求境界选择器状态
const showQualitySelector = ref(false)
const showRaritySelector = ref(false)
const showRealmSelector = ref(false)
const selectedQualities = ref<string[]>([])
const selectedRarities = ref<string[]>([])
const selectedRealms = ref<string[]>([])

// 可用品质列表（按需求境界+品质组合统计）
const availableQualities = computed(() => {
  if (!player.value?.inventory.equipments.length) return []

  const qualityGroups: Record<string, number> = {}
  player.value.inventory.equipments.forEach(eq => {
    // 组合键：需求境界-品质
    const key = `${eq.requireRealm}-${eq.requireRealmLevel}-${eq.quality}`
    qualityGroups[key] = (qualityGroups[key] || 0) + 1
  })

  return Object.entries(qualityGroups).map(([key, count]) => {
    const parts = key.split('-')
    const realmIndex = parts[0]
    const realmLevel = parts[1]
    const quality = parts.slice(2).join('-') // 处理品质名称可能包含'-'的情况
    const realmName = getRealmName(Number(realmIndex))

    return {
      label: `${realmName}${realmLevel}层-${quality}`,
      value: key,
      count
    }
  })
})

// 可用稀有度列表（按需求境界+稀有度组合统计）
const availableRarities = computed(() => {
  if (!player.value?.inventory.equipments.length) return []

  const rarityGroups: Record<string, number> = {}
  player.value.inventory.equipments.forEach(eq => {
    // 组合键：需求境界-稀有度
    const key = `${eq.requireRealm}-${eq.requireRealmLevel}-${eq.rarity}`
    rarityGroups[key] = (rarityGroups[key] || 0) + 1
  })

  return Object.entries(rarityGroups).map(([key, count]) => {
    const parts = key.split('-')
    const realmIndex = parts[0]
    const realmLevel = parts[1]
    const rarity = parts.slice(2).join('-') // 处理稀有度名称可能包含'-'的情况
    const realmName = getRealmName(Number(realmIndex))

    return {
      label: `${realmName}${realmLevel}层-${rarity}`,
      value: key,
      count
    }
  })
})

// 可用需求境界列表（带数量统计）
const availableRealms = computed(() => {
  if (!player.value?.inventory.equipments.length) return []

  const realmGroups: Record<string, number> = {}
  player.value.inventory.equipments.forEach(eq => {
    const realmKey = `${eq.requireRealm}-${eq.requireRealmLevel}`
    const realmName = `${getRealmName(eq.requireRealm)} ${eq.requireRealmLevel}层`
    realmGroups[realmKey] = (realmGroups[realmKey] || 0) + 1
  })

  return Object.entries(realmGroups).map(([key, count]) => {
    const [realmIndex, realmLevel] = key.split('-')
    const realmName = `${getRealmName(Number(realmIndex))} ${realmLevel}层`
    return {
      label: realmName,
      value: key,
      count
    }
  })
})

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


// 按品质批量出售
async function handleBatchSellByQuality() {
  if (!player.value?.inventory.equipments.length) {
    UI.toast({ title: '背包中没有装备', icon: 'none' })
    return
  }

  // 直接打开品质选择器
  selectedQualities.value = []
  showQualitySelector.value = true
}

// 按稀有度批量出售
async function handleBatchSellByRarity() {
  if (!player.value?.inventory.equipments.length) {
    UI.toast({ title: '背包中没有装备', icon: 'none' })
    return
  }

  // 直接打开稀有度选择器
  selectedRarities.value = []
  showRaritySelector.value = true
}

// 按需求境界批量出售
async function handleBatchSellByRealm() {
  if (!player.value?.inventory.equipments.length) {
    UI.toast({ title: '背包中没有装备', icon: 'none' })
    return
  }

  // 直接打开需求境界选择器
  selectedRealms.value = []
  showRealmSelector.value = true
}

// 切换品质选择
function toggleQuality(quality: string) {
  const index = selectedQualities.value.indexOf(quality)
  if (index > -1) {
    selectedQualities.value.splice(index, 1)
  } else {
    selectedQualities.value.push(quality)
  }
}

// 切换稀有度选择
function toggleRarity(rarity: string) {
  const index = selectedRarities.value.indexOf(rarity)
  if (index > -1) {
    selectedRarities.value.splice(index, 1)
  } else {
    selectedRarities.value.push(rarity)
  }
}

// 切换需求境界选择
function toggleRealm(realm: string) {
  const index = selectedRealms.value.indexOf(realm)
  if (index > -1) {
    selectedRealms.value.splice(index, 1)
  } else {
    selectedRealms.value.push(realm)
  }
}

// 确认品质选择并出售
async function confirmQualitySelection() {
  if (selectedQualities.value.length === 0) {
    UI.toast({ title: '请至少选择一个品质', icon: 'none' })
    return
  }

  showQualitySelector.value = false

  // 筛选出符合条件的装备（根据需求境界+品质组合）
  const equipments = player.value!.inventory.equipments.filter(eq => {
    const key = `${eq.requireRealm}-${eq.requireRealmLevel}-${eq.quality}`
    return selectedQualities.value.includes(key)
  })

  if (equipments.length === 0) {
    UI.toast({ title: '没有符合条件的装备', icon: 'none' })
    return
  }

  // 构建选择的条件描述
  const criteriaList = selectedQualities.value.map(key => {
    const parts = key.split('-')
    const realmIndex = parts[0]
    const realmLevel = parts[1]
    const quality = parts.slice(2).join('-') // 处理品质名称可能包含'-'的情况
    const realmName = getRealmName(Number(realmIndex))
    return `${realmName}${realmLevel}层-${quality}`
  })

  const criteria = `品质: ${criteriaList.join('、')}`
  await confirmAndSellEquipments(equipments, criteria)
}

// 确认稀有度选择并出售
async function confirmRaritySelection() {
  if (selectedRarities.value.length === 0) {
    UI.toast({ title: '请至少选择一个稀有度', icon: 'none' })
    return
  }

  showRaritySelector.value = false

  // 筛选出符合条件的装备（根据需求境界+稀有度组合）
  const equipments = player.value!.inventory.equipments.filter(eq => {
    const key = `${eq.requireRealm}-${eq.requireRealmLevel}-${eq.rarity}`
    return selectedRarities.value.includes(key)
  })

  if (equipments.length === 0) {
    UI.toast({ title: '没有符合条件的装备', icon: 'none' })
    return
  }

  // 构建选择的条件描述
  const criteriaList = selectedRarities.value.map(key => {
    const parts = key.split('-')
    const realmIndex = parts[0]
    const realmLevel = parts[1]
    const rarity = parts.slice(2).join('-') // 处理稀有度名称可能包含'-'的情况
    const realmName = getRealmName(Number(realmIndex))
    return `${realmName}${realmLevel}层-${rarity}`
  })

  const criteria = `稀有度: ${criteriaList.join('、')}`
  await confirmAndSellEquipments(equipments, criteria)
}

// 确认需求境界选择并出售
async function confirmRealmSelection() {
  if (selectedRealms.value.length === 0) {
    UI.toast({ title: '请至少选择一个需求境界', icon: 'none' })
    return
  }

  showRealmSelector.value = false

  // 筛选出符合条件的装备
  const equipments = player.value!.inventory.equipments.filter(eq => {
    const realmKey = `${eq.requireRealm}-${eq.requireRealmLevel}`
    return selectedRealms.value.includes(realmKey)
  })

  if (equipments.length === 0) {
    UI.toast({ title: '没有符合条件的装备', icon: 'none' })
    return
  }

  // 构建境界��称列表
  const realmNames = selectedRealms.value.map(key => {
    const [realmIndex, realmLevel] = key.split('-')
    return `${getRealmName(Number(realmIndex))} ${realmLevel}层`
  })

  const criteria = `需求境界: ${realmNames.join('、')}`
  await confirmAndSellEquipments(equipments, criteria)
}

// 按品质选择出售（旧版本 - 保留作为备用）
async function selectByQuality() {
  // 统计背包中的品质分布
  const qualityGroups: Record<string, Equipment[]> = {}
  player.value?.inventory.equipments.forEach(eq => {
    if (!qualityGroups[eq.quality]) {
      qualityGroups[eq.quality] = []
    }
    qualityGroups[eq.quality].push(eq)
  })

  // 构建品质列表信息
  const qualityList = Object.entries(qualityGroups)
    .map(([quality, eqs]) => `${quality}: ${eqs.length}件`)
    .join('\n')

  const selectRes = await UI.modal({
    title: '选择品质',
    content: `背包中的装备品质分布:\n${qualityList}\n\n选择要出售的品质`,
    confirmText: '下品',
    cancelText: '中品'
  })

  let selectedQuality = ''
  if (selectRes.confirm) {
    selectedQuality = '下品'
  } else if (selectRes.cancel) {
    // 继续选择上品或极品
    const selectRes2 = await UI.modal({
      title: '选择品质',
      content: `背包中的装��品质分布:\n${qualityList}\n\n选择要出售的品质`,
      confirmText: '上品',
      cancelText: '极品'
    })

    if (selectRes2.confirm) {
      selectedQuality = '上品'
    } else if (selectRes2.cancel) {
      selectedQuality = '极品'
    }
  }

  if (selectedQuality && qualityGroups[selectedQuality]) {
    await confirmAndSellEquipments(qualityGroups[selectedQuality], `品质: ${selectedQuality}`)
  }
}

// 按稀有度选择出售（旧版本 - 保留作为备用）
async function selectByRarity() {
  // 统计背包中的稀有度分布
  const rarityGroups: Record<string, Equipment[]> = {}
  player.value?.inventory.equipments.forEach(eq => {
    if (!rarityGroups[eq.rarity]) {
      rarityGroups[eq.rarity] = []
    }
    rarityGroups[eq.rarity].push(eq)
  })

  // 构建稀有度列表信息
  const rarityList = Object.entries(rarityGroups)
    .map(([rarity, eqs]) => `${rarity}: ${eqs.length}件`)
    .join('\n')

  const selectRes = await UI.modal({
    title: '选择稀有度',
    content: `背包中的装备稀有度分布:\n${rarityList}\n\n选择要出售的稀有度（点击确定继续选择）`,
    confirmText: '继续选择',
    cancelText: '取消'
  })

  if (!selectRes.confirm) return

  // 让用户从可用的稀有度中选择
  const availableRarities = Object.keys(rarityGroups)
  if (availableRarities.length === 0) return

  // 分批展示稀有度选项
  let selectedRarity = ''

  // 第一批：凡品、黄品
  if (rarityGroups['凡品'] || rarityGroups['黄品']) {
    const res1 = await UI.modal({
      title: '选择稀有度',
      content: rarityList,
      confirmText: rarityGroups['凡品'] ? '凡品' : '下一页',
      cancelText: rarityGroups['黄品'] ? '黄品' : '下一页'
    })

    if (res1.confirm && rarityGroups['凡品']) {
      selectedRarity = '凡品'
    } else if (res1.cancel && rarityGroups['黄品']) {
      selectedRarity = '黄品'
    }
  }

  // 如果还没选择，继续第二批：玄品、地品
  if (!selectedRarity && (rarityGroups['玄品'] || rarityGroups['地品'])) {
    const res2 = await UI.modal({
      title: '选择稀有度',
      content: rarityList,
      confirmText: rarityGroups['玄品'] ? '玄品' : '下一页',
      cancelText: rarityGroups['地品'] ? '地品' : '下一页'
    })

    if (res2.confirm && rarityGroups['玄品']) {
      selectedRarity = '玄品'
    } else if (res2.cancel && rarityGroups['地品']) {
      selectedRarity = '地品'
    }
  }

  // 如果还没选择，继续第三批：天品、仙品
  if (!selectedRarity && (rarityGroups['天品'] || rarityGroups['仙品'])) {
    const res3 = await UI.modal({
      title: '选择稀有度',
      content: rarityList,
      confirmText: rarityGroups['天品'] ? '天品' : '下一页',
      cancelText: rarityGroups['仙品'] ? '仙品' : '下一页'
    })

    if (res3.confirm && rarityGroups['天品']) {
      selectedRarity = '天品'
    } else if (res3.cancel && rarityGroups['仙品']) {
      selectedRarity = '仙品'
    }
  }

  if (selectedRarity && rarityGroups[selectedRarity]) {
    await confirmAndSellEquipments(rarityGroups[selectedRarity], `稀有度: ${selectedRarity}`)
  }
}

// 确认并出售装备
async function confirmAndSellEquipments(equipments: Equipment[], criteria: string) {
  if (equipments.length === 0) {
    UI.toast({ title: '没有符合条件的装备', icon: 'none' })
    return
  }

  // 计算总售价
  const totalPrice = equipments.reduce((sum, eq) => {
    return sum + calculateEquipmentSellPrice(eq)
  }, 0)

  // 按品质分组统计
  const qualityGroups: Record<string, number> = {}
  equipments.forEach(eq => {
    qualityGroups[eq.quality] = (qualityGroups[eq.quality] || 0) + 1
  })

  const groupInfo = Object.entries(qualityGroups)
    .map(([quality, count]) => `${quality}×${count}`)
    .join('、')

  const content = `${criteria}\n共 ${equipments.length} 件装备\n${groupInfo}\n\n总售价: ${gameStore.formatNumber(totalPrice)} 灵石`

  const res = await UI.modal({
    title: '批量出售确认',
    content,
    confirmText: '出售',
    cancelText: '取消'
  })

  if (res.confirm) {
    let totalSellPrice = 0
    equipments.forEach(eq => {
      totalSellPrice += gameStore.sellEquipment(eq)
    })

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

    const enhanceText = equipped.enhanceLevel ? ` +${equipped.enhanceLevel}` : ''
    const details = `${getEquipmentFullName(equipped)}${enhanceText}\n` +
      `等级: Lv.${equipped.level}\n` +
      `稀有度: ${equipped.rarity}\n` +
      `品质: ${equipped.quality}\n` +
      `需求: ${getRealmName(equipped.requireRealm)} ${equipped.requireRealmLevel}层\n` +
      `\n属性:\n${attrs}`

    const res = await UI.modal({
      title: '装备详情',
      content: details,
      confirmText: '强化',
      cancelText: '卸下'
    })

    if (res.confirm && player.value) {
      // 点击强化按钮
      await handleEnhanceClick(equipped)
    } else if (res.cancel && player.value) {
      // 点击卸下按钮
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
    cancelText: '更多操作'
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
  } else if (res.cancel) {
    // 显示更多操作菜单
    const actionRes = await UI.modal({
      title: '选择操作',
      content: '请选择要进行的操作',
      confirmText: '强化',
      cancelText: '出售'
    })

    if (actionRes.confirm) {
      // 强化
      await handleEnhanceClick(newEquipment)
    } else if (actionRes.cancel) {
      // 出售
      await handleSellClick(newEquipment)
    }
  }
}

async function handleEnhanceClick(equipment: Equipment) {
  if (!player.value) return

  // 获取强化消耗
  const cost = gameStore.getEnhanceCost(equipment)
  const currentLevel = equipment.enhanceLevel || 0

  // 构建装备信息
  const attrs = Object.entries(equipment.attributes)
    .map(([key, value]) => `${getAttrName(key)}+${formatAttrValue(key, value as number)}`)
    .join('\n')

  const enhanceText = currentLevel > 0 ? ` +${currentLevel}` : ''
  const details = `${getEquipmentFullName(equipment)}${enhanceText}\n` +
    `等级: Lv.${equipment.level}\n` +
    `稀有度: ${equipment.rarity}\n` +
    `品质: ${equipment.quality}\n` +
    `\n当前属性:\n${attrs}\n` +
    `\n强化消耗:\n` +
    `强化石: ${cost.stoneCost} (拥有: ${player.value.resources.enhanceStone || 0})\n` +
    `灵石: ${gameStore.formatNumber(cost.lingStoneCost)} (拥有: ${gameStore.formatNumber(player.value.resources.lingStone)})\n` +
    `成功率: ${(cost.successRate * 100).toFixed(1)}%\n` +
    `\n提示: 强化成功后装备属性提升5%`

  const res = await UI.modal({
    title: '装备强化',
    content: details,
    confirmText: '强化',
    cancelText: '取消'
  })

  if (res.confirm) {
    const result = gameStore.enhanceEquipment(equipment)
    UI.toast({
      title: result.message,
      icon: result.success ? 'success' : 'none',
      duration: 2000
    })
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
.btn-batch-sell,
.btn-batch-sell-by-quality,
.btn-batch-sell-by-rarity,
.btn-batch-sell-by-realm {
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

.btn-batch-sell-by-quality {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

.btn-batch-sell-by-rarity {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
}

.btn-batch-sell-by-realm {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
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

.btn-enhance,
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

.btn-enhance {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.btn-enhance:active {
  opacity: 0.8;
  transform: scale(0.95);
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

/* 品质/稀有度选择器弹窗样式 */
.selector-popup {
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.selector-title {
  font-size: 16px;
  font-weight: bold;
  color: #1a1a2e;
}

.selector-cancel {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.selector-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.btn-confirm {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(244, 164, 96, 0.3);
}

.btn-confirm:active {
  opacity: 0.8;
  transform: scale(0.98);
}

</style>
