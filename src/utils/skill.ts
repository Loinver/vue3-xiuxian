/**
 * 技能相关工具函数
 */

import type { Skill } from '@/types'
import { SKILL_SELL_CONFIG } from '@/config/game'

/**
 * 计算技能书售价
 * @param skill 技能对象
 * @returns 售价(整数)
 */
export function calculateSkillSellPrice(skill: Skill): number {
  // 使用学习消耗的50%作为售价
  const sellPrice = Math.floor(skill.learnCost.lingStone * SKILL_SELL_CONFIG.sellRatio)
  return sellPrice
}
