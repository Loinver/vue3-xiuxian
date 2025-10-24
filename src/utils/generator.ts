/**
 * 装备和技能生成器
 * 负责生成随机装备和技能,包括稀有度计算、属性生成等
 */

import type { Equipment, Skill, EquipmentAttributes } from '@/types/game'
import { EquipmentRarity, EquipmentQuality, EquipmentSlot, SkillRarity, SkillType } from '@/types/game'
import { EQUIPMENT_RARITY_WEIGHTS, SKILL_RARITY_WEIGHTS } from '@/config/game'

// 装备名称库
const equipmentNames = {
  [EquipmentSlot.WEAPON]: ['木剑', '青云剑', '紫霄剑', '龙吟剑', '天罡剑', '神器·斩天剑', '盘古斧', '太极图', '诛仙剑', '混元金斗', '开天神斧', '混沌钟', '混沌珠'],
  [EquipmentSlot.ARMOR]: ['布衣', '玄铁护甲', '紫金战甲', '龙鳞铠', '天蚕宝甲', '神器·不灭战甲', '后天金甲', '九龙袍', '先天道袍', '混元战甲', '混沌神甲', '鸿蒙圣衣'],
  [EquipmentSlot.HELMET]: ['布帽', '玄铁头盔', '紫金冠', '龙角盔', '天罡冠', '神器·无极冠', '后天仙冠', '九天神冠', '先天灵冠', '混元宝冠', '混沌神冠', '鸿蒙圣冠'],
  [EquipmentSlot.BOOTS]: ['草鞋', '云纹靴', '流云靴', '龙行靴', '凌波靴', '神器·追风靴', '后天仙靴', '九霄云履', '先天神履', '混元宝靴', '混沌神靴', '鸿蒙圣靴'],
  [EquipmentSlot.RING]: ['木环', '玄玉戒', '紫晶坠', '龙魂佩', '天罡符', '神器·混元珠', '后天仙戒', '九天神环', '先天灵戒', '混元宝戒', '混沌神戒', '鸿蒙圣戒'],
  [EquipmentSlot.NECKLACE]: ['木链', '玄玉佩', '紫晶坠', '龙魂链', '天罡符', '神器·混元链', '后天仙佩', '九天神链', '先天灵佩', '混元宝链', '混沌神链', '鸿蒙圣链'],
}

// 技能名称库
const skillNames = {
  active: ['烈焰掌', '冰霜术', '雷霆一击', '风刃斩', '大地震击', '天雷灭世', '九天神雷'],
  passive: ['灵气护体', '修为凝练', '神识坚韧', '法力涌动', '神速', '不灭金身', '天人合一'],
}

// 稀有度对应等级
const rarityToLevel: Record<EquipmentRarity, number> = {
  [EquipmentRarity.COMMON]: 0,
  [EquipmentRarity.YELLOW]: 1,
  [EquipmentRarity.DARK]: 2,
  [EquipmentRarity.EARTH]: 3,
  [EquipmentRarity.HEAVEN]: 4,
  [EquipmentRarity.IMMORTAL]: 5,
  [EquipmentRarity.ARTIFACT]: 6,
  [EquipmentRarity.POSTNATAL_TREASURE]: 7,
  [EquipmentRarity.POSTNATAL_SUPREME]: 8,
  [EquipmentRarity.INNATE_TREASURE]: 9,
  [EquipmentRarity.INNATE_SUPREME]: 10,
  [EquipmentRarity.CHAOS_TREASURE]: 11,
  [EquipmentRarity.CHAOS_SUPREME]: 12,
}

const rarityList = [
  EquipmentRarity.COMMON,
  EquipmentRarity.YELLOW,
  EquipmentRarity.DARK,
  EquipmentRarity.EARTH,
  EquipmentRarity.HEAVEN,
  EquipmentRarity.IMMORTAL,
  EquipmentRarity.ARTIFACT,
  EquipmentRarity.POSTNATAL_TREASURE,
  EquipmentRarity.POSTNATAL_SUPREME,
  EquipmentRarity.INNATE_TREASURE,
  EquipmentRarity.INNATE_SUPREME,
  EquipmentRarity.CHAOS_TREASURE,
  EquipmentRarity.CHAOS_SUPREME,
]

const skillRarityList = [
  SkillRarity.YELLOW,
  SkillRarity.DARK,
  SkillRarity.EARTH,
  SkillRarity.HEAVEN,
  SkillRarity.IMMORTAL,
  SkillRarity.GOD,
]

// 工具函数
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 根据权重配置随机选择稀有度
 * @param weights 稀有度权重对象
 * @param realmIndex 玩家境界索引,用于动态调整权重
 * @returns 选中的稀有度
 */
function selectRarityByWeight<T extends string>(
  weights: Record<T, number>,
  realmIndex: number
): T {
  // 根据境界调整权重
  const adjustedWeights: Array<{ rarity: T; weight: number }> = []

  Object.entries(weights).forEach(([rarity, baseWeight]) => {
    // 境界越高,高品质装备权重增加,低品质装备权重降低
    const baseWeightNum = baseWeight as number
    let weight = baseWeightNum

    // 获取稀有度在列表中的索引
    const rarityIndex = Object.keys(weights).indexOf(rarity)

    if (rarityIndex < 2) {
      // 低品质(前2个) - 境界越高权重降低
      weight = Math.max(baseWeightNum - realmIndex * 5, 1)
    } else if (rarityIndex > 3) {
      // 高品质(后面的) - 境界越高权重增加
      weight = baseWeightNum + realmIndex * 2
    }

    adjustedWeights.push({ rarity: rarity as T, weight })
  })

  // 计算总权重
  const totalWeight = adjustedWeights.reduce((sum, item) => sum + item.weight, 0)

  // 随机选择
  let random = Math.random() * totalWeight

  for (const { rarity, weight } of adjustedWeights) {
    random -= weight
    if (random <= 0) {
      return rarity
    }
  }

  // 默认返回第一个
  return adjustedWeights[0].rarity
}

/**
 * 根据玩家境界计算装备稀有度
 * 使用配置的权重进行随机,境界越高越容易掉落高品质装备
 */
export function getEquipmentRarity(realmIndex: number): EquipmentRarity {
  return selectRarityByWeight(EQUIPMENT_RARITY_WEIGHTS, realmIndex)
}

/**
 * 根据地图境界等级限制装备稀有度范围
 * 每个地图只掉落对应等级的装备
 */
export function getEquipmentRarityForMap(mapRealmIndex: number): EquipmentRarity {
  // 定义每个境界对应的稀有度范围
  const rarityRangesByRealm: Record<number, EquipmentRarity[]> = {
    0: [EquipmentRarity.COMMON, EquipmentRarity.YELLOW], // 炼气期: 凡品-黄品
    1: [EquipmentRarity.YELLOW, EquipmentRarity.DARK], // 筑基期: 黄品-玄品
    2: [EquipmentRarity.DARK, EquipmentRarity.EARTH], // 金丹期: 玄品-地品
    3: [EquipmentRarity.EARTH, EquipmentRarity.HEAVEN], // 元婴期: 地品-天品
    4: [EquipmentRarity.HEAVEN, EquipmentRarity.IMMORTAL], // 化神期: 天品-仙品
    5: [EquipmentRarity.IMMORTAL, EquipmentRarity.ARTIFACT], // 炼虚期: 仙品-神器
    6: [EquipmentRarity.IMMORTAL, EquipmentRarity.POSTNATAL_TREASURE], // 大乘期: 仙品-后天灵宝
    7: [EquipmentRarity.ARTIFACT, EquipmentRarity.POSTNATAL_TREASURE], // 渡劫期: 神器-后天灵宝
    8: [EquipmentRarity.POSTNATAL_TREASURE, EquipmentRarity.INNATE_TREASURE], // 地仙: 后天灵宝-先天灵宝
    9: [EquipmentRarity.POSTNATAL_TREASURE, EquipmentRarity.INNATE_TREASURE], // 天仙: 后天灵宝-先天灵宝
    10: [EquipmentRarity.POSTNATAL_TREASURE, EquipmentRarity.INNATE_TREASURE], // 玄仙: 后天灵宝-先天灵宝
    11: [EquipmentRarity.POSTNATAL_SUPREME, EquipmentRarity.INNATE_TREASURE], // 金仙: 后天至宝-先天灵宝
    12: [EquipmentRarity.POSTNATAL_SUPREME, EquipmentRarity.INNATE_TREASURE], // 太乙金仙: 后天至宝-先天灵宝
    13: [EquipmentRarity.POSTNATAL_SUPREME, EquipmentRarity.INNATE_SUPREME], // 大罗金仙: 后天至宝-先天至宝
    14: [EquipmentRarity.INNATE_TREASURE, EquipmentRarity.CHAOS_TREASURE], // 准圣: 先天灵宝-混沌灵宝
    15: [EquipmentRarity.CHAOS_TREASURE,EquipmentRarity.CHAOS_SUPREME], // 混元圣人: 混沌灵宝-混沌至宝
  }

  const availableRarities = rarityRangesByRealm[mapRealmIndex] || [EquipmentRarity.COMMON]

  // 在可用范围内随机选择,后面的稀有度权重更高
  const weights = availableRarities.map((_, index) => Math.pow(2, index))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < availableRarities.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return availableRarities[i]
    }
  }

  return availableRarities[availableRarities.length - 1]
}

/**
 * 品质权重配置
 * 品质越高概率越低
 */
const QUALITY_WEIGHTS = {
  [EquipmentQuality.LOW]: 40,      // 40% 下品
  [EquipmentQuality.MEDIUM]: 35,   // 35% 中品
  [EquipmentQuality.HIGH]: 20,     // 20% 上品
  [EquipmentQuality.PERFECT]: 5,   // 5% 极品
}

/**
 * 品质属性加成范围
 * 返回一个随机系数,用于乘以装备基础属性
 */
const QUALITY_MULTIPLIERS = {
  [EquipmentQuality.LOW]: [0.70, 0.85],      // 70-85%
  [EquipmentQuality.MEDIUM]: [0.85, 0.92],   // 85-92%
  [EquipmentQuality.HIGH]: [0.92, 1.00],     // 92-100%
  [EquipmentQuality.PERFECT]: [1.00, 1.15],  // 100-115%
}

/**
 * 随机生成装备品质
 */
function generateEquipmentQuality(): EquipmentQuality {
  const totalWeight = Object.values(QUALITY_WEIGHTS).reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (const [quality, weight] of Object.entries(QUALITY_WEIGHTS)) {
    random -= weight
    if (random <= 0) {
      return quality as EquipmentQuality
    }
  }

  return EquipmentQuality.MEDIUM // 默认返回中品
}

/**
 * 根据品质获取属性加成系数
 */
function getQualityMultiplier(quality: EquipmentQuality): number {
  const [min, max] = QUALITY_MULTIPLIERS[quality]
  return min + Math.random() * (max - min)
}

/**
 * 根据玩家境界计算技能稀有度
 * 使用配置的权重进行随机,境界越高越容易掉落高阶技能
 */
export function getSkillRarity(realmIndex: number): SkillRarity {
  return selectRarityByWeight(SKILL_RARITY_WEIGHTS, realmIndex)
}

// 生成装备属性
/**
 * 生成装备属性
 * @param slot 装备部位
 * @param rarity 装备稀有度
 * @param quality 装备品质
 * @param level 装备等级
 */
export function generateEquipmentAttributes(
  slot: EquipmentSlot,
  rarity: EquipmentRarity,
  quality: EquipmentQuality,
  level: number
): EquipmentAttributes {
  const rarityLevel = rarityToLevel[rarity]

  // 调整属性��率：使装备属性与怪物匹配
  const baseMultiplier = Math.pow(1.5, rarityLevel) // 降低指数增长速度
  const levelMultiplier = 1 + level * 0.1 // 降低等级加成

  // 境界加成：高境界装备额外加成
  const realmBonus = rarityLevel >= 7 ? Math.pow(1.5, rarityLevel - 6) : 1

  // 品质加成：根据品质随机一个系数
  const qualityMultiplier = getQualityMultiplier(quality)

  const attributes: EquipmentAttributes = {}

  // 根据部位分配主属性（调整基础值以匹配怪物强度）
  switch (slot) {
    case EquipmentSlot.WEAPON:
      // 攻击：1级凡品约3-5，随等级和稀有度成长
      attributes.attack = Math.floor(3 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      if (rarityLevel >= 2) {
        attributes.critRate = (0.02 + rarityLevel * 0.01 + Math.random() * 0.02) * qualityMultiplier
      }
      if (rarityLevel >= 3) {
        attributes.critDamage = (0.1 + rarityLevel * 0.05 + Math.random() * 0.1) * qualityMultiplier
      }
      break

    case EquipmentSlot.ARMOR:
      // 防御：1级凡品约2-4，生命约30-50
      attributes.defense = Math.floor(2 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      attributes.hpMax = Math.floor(30 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      if (rarityLevel >= 2) {
        attributes.block = (0.02 + rarityLevel * 0.01 + Math.random() * 0.02) * qualityMultiplier
      }
      break

    case EquipmentSlot.HELMET:
      // 防御：1级凡品约1-3，生命约20-40
      attributes.defense = Math.floor(1.5 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      attributes.hpMax = Math.floor(20 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      if (rarityLevel >= 2) {
        attributes.mpMax = Math.floor(10 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      }
      break

    case EquipmentSlot.BOOTS:
      // 速度：1级凡品约2-4
      attributes.speed = Math.floor(2 * baseMultiplier * levelMultiplier * qualityMultiplier * (0.9 + Math.random() * 0.2))
      if (rarityLevel >= 2) {
        attributes.dodge = (0.02 + rarityLevel * 0.01 + Math.random() * 0.02) * qualityMultiplier
      }
      if (rarityLevel >= 3) {
        attributes.defense = Math.floor(1 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
      }
      break

    case EquipmentSlot.RING:
    case EquipmentSlot.NECKLACE:
      // 饰品随机分配属性（数值相对较低）
      const attrs = ['attack', 'defense', 'hpMax', 'critRate', 'dodge']
      const selectedAttrs = attrs.sort(() => Math.random() - 0.5).slice(0, 2 + Math.min(rarityLevel, 3))

      selectedAttrs.forEach(attr => {
        switch (attr) {
          case 'attack':
            attributes.attack = Math.floor(2 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
            break
          case 'defense':
            attributes.defense = Math.floor(1.5 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
            break
          case 'hpMax':
            attributes.hpMax = Math.floor(15 * baseMultiplier * levelMultiplier * realmBonus * qualityMultiplier * (0.9 + Math.random() * 0.2))
            break
          case 'critRate':
            attributes.critRate = (0.02 + rarityLevel * 0.01 + Math.random() * 0.02) * qualityMultiplier
            break
          case 'dodge':
            attributes.dodge = (0.02 + rarityLevel * 0.01 + Math.random() * 0.02) * qualityMultiplier
            break
        }
      })
      break
  }

  return attributes
}

// 生成装备
/**
 * 生成装备
 * @param slot 装备部位
 * @param realmIndex 境界索引(用于确定装备需求和属性基础)
 * @param level 装备等级
 * @param useMapRestriction 是否使用地图限制(true=根据地图境界限制稀有度)
 */
export function generateEquipment(
  slot: EquipmentSlot,
  realmIndex: number,
  level: number = 1,
  useMapRestriction: boolean = false
): Equipment {
  // 根据参数选择稀有度生成方式
  const rarity = useMapRestriction
    ? getEquipmentRarityForMap(realmIndex)
    : getEquipmentRarity(realmIndex)

  // 生成品质
  const quality = generateEquipmentQuality()

  const rarityLevel = rarityToLevel[rarity]
  const attributes = generateEquipmentAttributes(slot, rarity, quality, level)

  const nameList = equipmentNames[slot]
  const name = nameList[Math.min(rarityLevel, nameList.length - 1)]

  // 确保requireRealm不超过最大境界索引(15 = 混元圣人)
  const maxRealmIndex = 15

  // 根据稀有度计算境界要求
  // 凡品-神器(0-6): 对应炼气期-大乘期(0-6)
  // 后天灵宝(7): 渡劫期(7)
  // 后天至宝(8): 地仙(8)
  // 先天灵宝(9): 天仙(9)
  // 先天至宝(10): 玄仙(10)
  // 混沌灵宝(11): 金仙(11)
  // 混沌至宝(12): 大罗金仙及以上(12-15),根据怪物/地图境界决定
  let requireRealm = rarityLevel
  if (rarityLevel >= 12) {
    // 混沌至宝根据地图境界来确定需求
    // 如果是从地图掉落,使用地图境界;否则至少是太乙金仙(12)
    requireRealm = Math.max(realmIndex, 12)
  } else if (rarityLevel >= 7) {
    // 仙界装备:后天灵宝开始必须是渡劫期以上
    requireRealm = Math.min(rarityLevel, maxRealmIndex)
  } else {
    // 凡间装备
    requireRealm = Math.min(Math.floor(rarityLevel * 1.5), 6)
  }

  return {
    id: generateId(),
    name,
    slot,
    rarity,
    quality,
    level,
    requireRealm,
    requireRealmLevel: Math.min(rarityLevel * 2, 9),
    attributes,
    enhanceLevel: 0,
  }
}

/**
 * 生成技能
 * @param type 技能类型(主动/被动)
 * @param realmIndex 玩家境界索引
 */
export function generateSkill(type: SkillType, realmIndex: number): Skill {
  // 使用配置的权重选择稀有度
  const rarity = getSkillRarity(realmIndex)
  const rarityIndex = skillRarityList.indexOf(rarity)

  const nameList = type === SkillType.ACTIVE ? skillNames.active : skillNames.passive
  const name = nameList[Math.min(rarityIndex, nameList.length - 1)]

  const level = 1
  const maxLevel = 10 + rarityIndex * 5

  if (type === SkillType.ACTIVE) {
    return {
      id: generateId(),
      name,
      type,
      rarity,
      level,
      maxLevel,
      manaCost: 30 + rarityIndex * 20,
      cooldown: 3000 - rarityIndex * 200,
      effect: {
        type: 'damage',
        value: 1.5 + rarityIndex * 0.3,
      },
      description: `释放${name}，对敌人造成${((1.5 + rarityIndex * 0.3) * 100).toFixed(0)}%攻击力的伤害`,
      learnCost: {
        lingStone: 1000 + rarityIndex * 5000,
        needSecretBook: true,
      },
      upgradeCost: {
        comprehensionPoint: 10 + rarityIndex * 10,
        lingStone: 500 + rarityIndex * 2000,
      },
    }
  } else {
    const passiveAttrs: EquipmentAttributes = {}

    // 被动技能提供属性加成
    const attrType = ['attack', 'defense', 'hpMax', 'critRate', 'dodge'][rarityIndex % 5]
    switch (attrType) {
      case 'attack':
        passiveAttrs.attack = 20 + rarityIndex * 15
        break
      case 'defense':
        passiveAttrs.defense = 15 + rarityIndex * 10
        break
      case 'hpMax':
        passiveAttrs.hpMax = 100 + rarityIndex * 80
        break
      case 'critRate':
        passiveAttrs.critRate = 0.02 + rarityIndex * 0.015
        break
      case 'dodge':
        passiveAttrs.dodge = 0.02 + rarityIndex * 0.015
        break
    }

    return {
      id: generateId(),
      name,
      type,
      rarity,
      level,
      maxLevel,
      effect: {
        type: 'buff',
        value: 1,
      },
      description: `永久提升${attrType === 'attack' ? '攻击力' : attrType === 'defense' ? '防御力' : attrType === 'hpMax' ? '生命上限' : attrType === 'critRate' ? '暴击率' : '闪避率'}`,
      passive: passiveAttrs,
      learnCost: {
        lingStone: 1000 + rarityIndex * 5000,
        needSecretBook: true,
      },
      upgradeCost: {
        comprehensionPoint: 10 + rarityIndex * 10,
        lingStone: 500 + rarityIndex * 2000,
      },
    }
  }
}

// 生成初始装备
export function generateStarterEquipment(): Equipment[] {
  return [
    generateEquipment(EquipmentSlot.WEAPON, 0, 1),
    generateEquipment(EquipmentSlot.ARMOR, 0, 1),
  ]
}

// 生成初始技能
export function generateStarterSkills(): Skill[] {
  return [generateSkill(SkillType.ACTIVE, 0), generateSkill(SkillType.PASSIVE, 0)]
}
