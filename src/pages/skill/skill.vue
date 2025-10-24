<template>
  <div class="skill-page">
    <div class="card">
      <div class="card-title">已学技能</div>
      <div class="skill-tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          主动技能
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'passive' }"
          @click="activeTab = 'passive'"
        >
          被动技能
        </div>
      </div>

      <div style="overflow-y: auto" class="skill-list">
        <div
          v-for="skill in displaySkills"
          :key="skill.id"
          class="skill-item"
        >
          <div class="skill-info">
            <div class="skill-name" :class="`rarity-${skill.rarity}`">
              {{ skill.name }} Lv.{{ skill.level }}
            </div>
            <div class="skill-desc">{{ skill.description }}</div>
            <!-- 显示被动技能属性 -->
            <div v-if="skill.passive" class="passive-attrs">
              <span v-for="(value, key) in skill.passive" :key="key" class="attr-tag">
                {{ getAttrName(key) }}+{{ formatAttrValue(key, value as number) }}
              </span>
            </div>
            <!-- 显示升级消耗 -->
            <div v-if="skill.level < skill.maxLevel" class="upgrade-cost">
              升级消耗: {{ skill.upgradeCost.comprehensionPoint }}悟道点 + {{ skill.upgradeCost.lingStone }}灵石
            </div>
          </div>
          <button
            v-if="skill.level < skill.maxLevel"
            class="btn-upgrade"
            size="mini"
            @click="handleUpgrade(skill)"
          >
            升级
          </button>
          <div v-else class="max-level-tag">
            满级
          </div>
        </div>
        <div v-if="!displaySkills.length" class="empty-tip">
          还没有学习任何技能
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">技能书 ({{ player?.inventory.skillBooks.length }})</div>
      <div style="overflow-y: auto" class="skill-list">
        <div
          v-for="(skill, index) in player?.inventory.skillBooks"
          :key="index"
          class="skill-item"
        >
          <div class="skill-info">
            <div class="skill-name" :class="`rarity-${skill.rarity}`">
              {{ skill.name }}
            </div>
            <div class="skill-desc">{{ skill.description }}</div>
            <!-- 显示被动技能属性 -->
            <div v-if="skill.passive" class="passive-attrs">
              <span v-for="(value, key) in skill.passive" :key="key" class="attr-tag">
                {{ getAttrName(key) }}+{{ formatAttrValue(key, value as number) }}
              </span>
            </div>
            <div class="skill-cost">
              学习消耗: {{ skill.learnCost.lingStone }}灵石
            </div>
          </div>
          <button class="btn-learn" size="mini" @click="handleLearn(skill)">
            学习
          </button>
        </div>
        <div v-if="!player?.inventory.skillBooks.length" class="empty-tip">
          没有技能书
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Skill } from '@/types/game'
import UI from '@/utils/ui'

const gameStore = useGameStore()
const player = computed(() => gameStore.player)
const activeTab = ref('active')

const displaySkills = computed(() => {
  if (!player.value) return []
  return activeTab.value === 'active'
    ? player.value.skills.active
    : player.value.skills.passive
})

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

function handleLearn(skill: Skill) {
  if (!player.value) return

  if (player.value.resources.lingStone < skill.learnCost.lingStone) {
    UI.toast({ title: '灵石不足', icon: 'none' })
    return
  }

  const skillList = skill.type === 'active' ? player.value.skills.active : player.value.skills.passive

  // 检查是否已经学过相同技能
  const existingSkill = skillList.find(s => s.name === skill.name)

  if (existingSkill) {
    // 如果已经学过,提升等级
    if (existingSkill.level >= existingSkill.maxLevel) {
      UI.toast({ title: '技能已满级', icon: 'none' })
      return
    }

    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone - skill.learnCost.lingStone)
    existingSkill.level++

    // 提升技能属性
    if (existingSkill.passive && skill.passive) {
      Object.entries(skill.passive).forEach(([key, value]) => {
        if (existingSkill.passive && value) {
          const currentValue = existingSkill.passive[key as keyof typeof existingSkill.passive] || 0
          existingSkill.passive[key as keyof typeof existingSkill.passive] = currentValue + value as any
        }
      })
    }

    if (existingSkill.effect && skill.effect) {
      existingSkill.effect.value = (existingSkill.effect.value || 0) + (skill.effect.value || 0) * 0.1
    }

    UI.toast({ title: `${skill.name}提升至Lv.${existingSkill.level}`, icon: 'success' })
  } else {
    // 如果没学过,新学习
    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone - skill.learnCost.lingStone)
    skillList.push({ ...skill, level: 1 })
    UI.toast({ title: '学习成功', icon: 'success' })
  }

  // 从背包移除
  const index = player.value.inventory.skillBooks.indexOf(skill)
  player.value.inventory.skillBooks.splice(index, 1)

  gameStore.saveGame()
}

async function handleUpgrade(skill: Skill) {
  if (!player.value) return

  if (player.value.resources.comprehensionPoint < skill.upgradeCost.comprehensionPoint) {
    UI.toast({ title: '悟道点不足', icon: 'none' })
    return
  }

  if (player.value.resources.lingStone < skill.upgradeCost.lingStone) {
    UI.toast({ title: '灵石不足', icon: 'none' })
    return
  }

  // 升级技能
  player.value.resources.comprehensionPoint = Math.floor(player.value.resources.comprehensionPoint - skill.upgradeCost.comprehensionPoint)
  player.value.resources.lingStone = Math.floor(player.value.resources.lingStone - skill.upgradeCost.lingStone)

  const oldLevel = skill.level
  skill.level++

  let upgradeDetails = ''

  // 提升被动技能属性 - 每级提升10%当前值
  if (skill.passive) {
    const attrChanges: string[] = []
    Object.keys(skill.passive).forEach(key => {
      const attrKey = key as keyof typeof skill.passive
      if (skill.passive && skill.passive[attrKey]) {
        const oldValue = skill.passive[attrKey] as number
        const increment = Math.max(1, Math.floor(oldValue * 0.1)) // 至少增加1
        const newValue = oldValue + increment
        skill.passive[attrKey] = newValue as any

        // 构建属性变化提示
        attrChanges.push(`${getAttrName(key)}: ${formatAttrValue(key, oldValue)} → ${formatAttrValue(key, newValue)}`)
      }
    })
    if (attrChanges.length > 0) {
      upgradeDetails = '\n' + attrChanges.join('\n')
    }
  }

  // 提升主动技能效果 - 每级提升5%
  if (skill.effect && skill.type === 'active') {
    const oldValue = skill.effect.value || 0
    const newValue = oldValue * 1.05
    skill.effect.value = newValue
    upgradeDetails = `\n伤害倍率: ${(oldValue * 100).toFixed(1)}% → ${(newValue * 100).toFixed(1)}%`
  }

  gameStore.saveGame()

  if (upgradeDetails) {
    await UI.modal({
      title: '升级成功',
      content: `${skill.name} Lv.${oldLevel} → Lv.${skill.level}${upgradeDetails}`,
      showCancel: false,
      confirmText: '确定'
    })
  } else {
    UI.toast({ title: `升级成功! Lv.${oldLevel} → Lv.${skill.level}`, icon: 'success', duration: 2000 })
  }
}
</script>

<style scoped>
.skill-page {
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

.skill-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.tab-item:active {
  transform: scale(0.98);
}

.tab-item.active {
  background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(244, 164, 96, 0.3);
  border-color: #f4a460;
}


.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 6px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.skill-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.skill-info {
  flex: 1;
  padding-right: 6px;
  min-width: 0;
}

.skill-name {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 3px;
  line-height: 1.3;
}

.skill-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
  line-height: 1.4;
}

.passive-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.attr-tag {
  font-size: 9px;
  padding: 2px 4px;
  background: rgba(82, 196, 26, 0.12);
  color: #52c41a;
  border-radius: 3px;
  border: 1px solid rgba(82, 196, 26, 0.25);
  white-space: nowrap;
}

.upgrade-cost {
  font-size: 9px;
  color: #999;
  margin-top: 3px;
}

.max-level-tag {
  font-size: 12px;
  color: #ff8c42;
  font-weight: bold;
  padding: 6px 12px;
  min-width: 50px;
  flex-shrink: 0;
}

.skill-cost {
  font-size: 12px;
  color: #f4a460;
  font-weight: 500;
  background: rgba(244, 164, 96, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
  display: inline-block;
  margin-top: 3px;
}


.btn-upgrade,
.btn-learn {
  color: white;
  border: none;
  padding: 8px 14px;
  min-width: 54px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 1px 4px rgba(82, 196, 26, 0.3);
  flex-shrink: 0;
  cursor: pointer;
  line-height: 1.2;
}

.btn-upgrade {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.btn-learn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  box-shadow: 0 1px 4px rgba(24, 144, 255, 0.3);
}

.btn-upgrade:active,
.btn-learn:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 11px;
}

</style>
