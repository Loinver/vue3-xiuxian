/**
 * 装备相关工具函数
 */

import type { Equipment } from '@/types'
import { EquipmentQuality } from '@/types'
import { EQUIPMENT_SELL_CONFIG } from '@/config/game'

/**
 * 获取装备完整名称(包含品质前缀)
 * @param equipment 装备对象
 * @returns 完整名称,如"极品·混沌钟"
 */
export function getEquipmentFullName(equipment: Equipment): string {
  return `${equipment.quality}·${equipment.name}`
}

/**
 * 计算装备售价
 * @param equipment 装备对象
 * @returns 售价(整数)
 */
export function calculateEquipmentSellPrice(equipment: Equipment): number {
  const basePrice = EQUIPMENT_SELL_CONFIG.rarityMultipliers[equipment.rarity] || 10
  const levelBonus = equipment.level * EQUIPMENT_SELL_CONFIG.levelBonus
  const enhanceBonus = equipment.enhanceLevel * EQUIPMENT_SELL_CONFIG.enhanceBonus

  // 品质加成
  const qualityMultipliers = {
    [EquipmentQuality.LOW]: 0.8,
    [EquipmentQuality.MEDIUM]: 1.0,
    [EquipmentQuality.HIGH]: 1.3,
    [EquipmentQuality.PERFECT]: 1.8,
  }
  const qualityBonus = qualityMultipliers[equipment.quality] || 1.0

  return Math.floor((basePrice + levelBonus + enhanceBonus) * qualityBonus)
}
