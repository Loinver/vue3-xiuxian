/**
 * 游戏配置文件
 * 包含游戏中所有的静态配置数据,如境界、地图、怪物等
 */

import type { RealmConfig, MapConfig, MonsterConfig } from '@/types'
import { EquipmentRarity, SkillRarity } from '@/types'

/**
 * 境界配置数组
 * 定义从炼气期到飞升期的9个修炼境界
 * 每个境界包含层数、修为需求、突破消耗等属性
 */
export const REALMS: RealmConfig[] = [
  {
    id: 'lianqi',
    name: '炼气期',
    levels: 9,
    cultivationPerLevel: 1000,
    breakthroughCost: 5000,
    breakthroughSuccessRate: 0.9,
    attributeBonus: {
      hpMax: 100,
      attack: 10,
      defense: 5,
      speed: 5,
    },
  },
  {
    id: 'zhuji',
    name: '筑基期',
    levels: 9,
    cultivationPerLevel: 5000,
    breakthroughCost: 30000,
    breakthroughSuccessRate: 0.7,
    attributeBonus: {
      hpMax: 300,
      attack: 30,
      defense: 15,
      speed: 10,
    },
  },
  {
    id: 'jiedan',
    name: '结丹期',
    levels: 9,
    cultivationPerLevel: 20000,
    breakthroughCost: 150000,
    breakthroughSuccessRate: 0.5,
    attributeBonus: {
      hpMax: 800,
      attack: 80,
      defense: 40,
      speed: 20,
    },
  },
  {
    id: 'yuanying',
    name: '元婴期',
    levels: 9,
    cultivationPerLevel: 100000,
    breakthroughCost: 800000,
    breakthroughSuccessRate: 0.3,
    attributeBonus: {
      hpMax: 2000,
      attack: 200,
      defense: 100,
      speed: 30,
    },
  },
  {
    id: 'huashen',
    name: '化神期',
    levels: 9,
    cultivationPerLevel: 500000,
    breakthroughCost: 5000000,
    breakthroughSuccessRate: 0.2,
    attributeBonus: {
      hpMax: 5000,
      attack: 500,
      defense: 250,
      speed: 40,
    },
  },
  {
    id: 'lianxu',
    name: '炼虚期',
    levels: 9,
    cultivationPerLevel: 2000000,
    breakthroughCost: 20000000,
    breakthroughSuccessRate: 0.15,
    attributeBonus: {
      hpMax: 12000,
      attack: 1200,
      defense: 600,
      speed: 50,
    },
  },
  {
    id: 'dacheng',
    name: '大乘期',
    levels: 9,
    cultivationPerLevel: 10000000,
    breakthroughCost: 100000000,
    breakthroughSuccessRate: 0.1,
    attributeBonus: {
      hpMax: 30000,
      attack: 3000,
      defense: 1500,
      speed: 60,
    },
  },
  {
    id: 'dujie',
    name: '渡劫期',
    levels: 9,
    cultivationPerLevel: 50000000,
    breakthroughCost: 500000000,
    breakthroughSuccessRate: 0.05,
    attributeBonus: {
      hpMax: 80000,
      attack: 8000,
      defense: 4000,
      speed: 80,
    },
  },
  {
    id: 'feixian',
    name: '飞升期',
    levels: 1,
    cultivationPerLevel: 0,
    breakthroughCost: 0,
    breakthroughSuccessRate: 1,
    attributeBonus: {
      hpMax: 200000,
      attack: 20000,
      defense: 10000,
      speed: 100,
    },
  },
]

/**
 * 地图配置数组
 * 定义游戏中可探索的地图区域
 * 每个地图有境界要求和对应的怪物列表
 */
export const MAPS: MapConfig[] = [
  {
    id: 'beginner_forest',
    name: '新手森林',
    requireRealm: 0,
    requireRealmLevel: 1,
    monsters: ['slime', 'wolf', 'goblin'],
  },
  {
    id: 'spirit_valley',
    name: '灵气山谷',
    requireRealm: 0,
    requireRealmLevel: 5,
    monsters: ['spirit_deer', 'fire_fox', 'stone_golem'],
  },
  {
    id: 'dark_cave',
    name: '幽暗洞窟',
    requireRealm: 1,
    requireRealmLevel: 1,
    monsters: ['bat_demon', 'cave_spider', 'skeleton'],
  },
  {
    id: 'misty_mountain',
    name: '云雾山',
    requireRealm: 1,
    requireRealmLevel: 5,
    monsters: ['cloud_beast', 'thunder_eagle', 'mountain_tiger'],
  },
  {
    id: 'blood_plain',
    name: '血色平原',
    requireRealm: 2,
    requireRealmLevel: 1,
    monsters: ['blood_wolf', 'demon_warrior', 'cursed_knight'],
  },
  {
    id: 'ice_wasteland',
    name: '极寒冰原',
    requireRealm: 2,
    requireRealmLevel: 5,
    monsters: ['frost_giant', 'ice_dragon', 'snow_demon'],
  },
  {
    id: 'heaven_realm',
    name: '天界',
    requireRealm: 7,
    requireRealmLevel: 1,
    monsters: ['heaven_guard', 'divine_beast', 'immortal_general'],
  },
]

// 怪物配置
export const MONSTERS: MonsterConfig[] = [
  // 新手森林怪物
  {
    id: 'slime',
    name: '史莱姆',
    map: 'beginner_forest',
    level: 1,
    requireRealm: 0,
    requireRealmLevel: 1,
    attributes: {
      hp: 50,
      hpMax: 50,
      mp: 0,
      mpMax: 0,
      attack: 5,
      defense: 2,
      speed: 3,
      critRate: 0.05,
      critDamage: 1.5,
      dodge: 0.05,
      block: 0,
    },
    dropTable: {
      lingStone: [1, 3],
      experience: [5, 10],
      equipmentRate: 0.01,
      skillBookRate: 0.001,
    },
  },
  {
    id: 'wolf',
    name: '野狼',
    map: 'beginner_forest',
    level: 3,
    requireRealm: 0,
    requireRealmLevel: 2,
    attributes: {
      hp: 100,
      hpMax: 100,
      mp: 0,
      mpMax: 0,
      attack: 12,
      defense: 5,
      speed: 8,
      critRate: 0.1,
      critDamage: 1.5,
      dodge: 0.1,
      block: 0.05,
    },
    dropTable: {
      lingStone: [3, 8],
      experience: [10, 20],
      equipmentRate: 0.02,
      skillBookRate: 0.002,
    },
  },
  {
    id: 'goblin',
    name: '哥布林',
    map: 'beginner_forest',
    level: 5,
    requireRealm: 0,
    requireRealmLevel: 3,
    attributes: {
      hp: 150,
      hpMax: 150,
      mp: 0,
      mpMax: 0,
      attack: 18,
      defense: 8,
      speed: 12,
      critRate: 0.15,
      critDamage: 1.6,
      dodge: 0.12,
      block: 0.08,
    },
    dropTable: {
      lingStone: [8, 15],
      experience: [20, 35],
      equipmentRate: 0.03,
      skillBookRate: 0.005,
    },
  },
  // 灵气山谷怪物
  {
    id: 'spirit_deer',
    name: '灵鹿',
    map: 'spirit_valley',
    level: 8,
    requireRealm: 0,
    requireRealmLevel: 5,
    attributes: {
      hp: 300,
      hpMax: 300,
      mp: 50,
      mpMax: 50,
      attack: 30,
      defense: 15,
      speed: 20,
      critRate: 0.2,
      critDamage: 1.8,
      dodge: 0.2,
      block: 0.1,
    },
    dropTable: {
      lingStone: [15, 30],
      experience: [40, 60],
      equipmentRate: 0.05,
      skillBookRate: 0.01,
    },
  },
  {
    id: 'fire_fox',
    name: '火狐',
    map: 'spirit_valley',
    level: 10,
    requireRealm: 0,
    requireRealmLevel: 6,
    attributes: {
      hp: 350,
      hpMax: 350,
      mp: 80,
      mpMax: 80,
      attack: 40,
      defense: 18,
      speed: 25,
      critRate: 0.25,
      critDamage: 2.0,
      dodge: 0.25,
      block: 0.12,
    },
    dropTable: {
      lingStone: [25, 50],
      experience: [60, 90],
      equipmentRate: 0.08,
      skillBookRate: 0.015,
    },
  },
]

/**
 * 打坐修炼速度配置
 */
export const MEDITATION_SPEED = {
  baseRate: 100000000000, // 基础修为获取速度 (每秒)
  realmMultiplier: 0.5, // 境界倍率系数 (每个境界增加50%)
  interval: 1000, // 修炼间隔(毫秒)
}

/**
 * 战斗配置
 */
export const BATTLE_CONFIG = {
  battleInterval: 3000, // 战斗间隔(毫秒)
  maxBattleLog: 50, // 最大战斗日志条数
  reviveDelay: 10000, // 复活延迟(毫秒)
  offlineBattleReward: 50, // 离线战斗每次灵石奖励
}

/**
 * 离线收益配置
 */
export const OFFLINE_CONFIG = {
  maxOfflineHours: 24, // 最大离线收益时间(小时)
  offlineEfficiency: 0.8, // 离线收益效率(80%)
  minOfflineTime: 60000, // 最小离线时间(毫秒) - 少于此时间不计算离线收益
}

/**
 * 掉落配置
 */
export const DROP_CONFIG = {
  // 装备掉落基础概率 (会根据怪物等级调整)
  equipmentBaseRate: 0.5, // 5%基础掉率
  equipmentRatePerLevel: 0.01, // 每级增加1%掉率

  // 技能书掉落基础概率
  skillBookBaseRate: 0.01, // 1%基础掉率
  skillBookRatePerLevel: 0.005, // 每级增加0.5%掉率

  // 主动/被动技能掉落比例
  activeSkillRate: 0.6, // 60%概率掉落主动技能
  passiveSkillRate: 0.4, // 40%概率掉落被动技能
}

/**
 * 装备售价配置
 * 基础价格根据稀有度
 */
export const EQUIPMENT_SELL_CONFIG = {
  rarityMultipliers: {
    '凡品': 10,
    '黄品': 50,
    '玄品': 200,
    '地品': 800,
    '天品': 3000,
    '仙品': 12000,
    '神器': 50000,
    '后天灵宝': 200000,
    '后天至宝': 800000,
    '先天灵宝': 3000000,
    '先天至宝': 12000000,
    '混沌灵宝': 50000000,
    '混沌至宝': 200000000,
  },
  levelBonus: 5,      // 每级增加的灵石
  enhanceBonus: 20    // 每强化等级增加的灵石
}

/**
 * 装备稀有度权重配置
 * 权重越高,掉落概率越大
 * 会根据玩家境界动态调整
 */
export const EQUIPMENT_RARITY_WEIGHTS = {
  [EquipmentRarity.COMMON]: 50,      // 凡品 - 50%基础权重
  [EquipmentRarity.YELLOW]: 30,      // 黄品 - 30%基础权重
  [EquipmentRarity.DARK]: 12,        // 玄品 - 12%基础权重
  [EquipmentRarity.EARTH]: 5,        // 地品 - 5%基础权重
  [EquipmentRarity.HEAVEN]: 2,       // 天品 - 2%基础权重
  [EquipmentRarity.IMMORTAL]: 0.8,   // 仙品 - 0.8%基础权重
  [EquipmentRarity.ARTIFACT]: 0.2,   // 神器 - 0.2%基础权重
  [EquipmentRarity.POSTNATAL_TREASURE]: 0.08,  // 后天灵宝 - 0.08%基础权重
  [EquipmentRarity.POSTNATAL_SUPREME]: 0.03,   // 后天至宝 - 0.03%基础权重
  [EquipmentRarity.INNATE_TREASURE]: 0.01,     // 先天灵宝 - 0.01%基础权重
  [EquipmentRarity.INNATE_SUPREME]: 0.003,     // 先天至宝 - 0.003%基础权重
  [EquipmentRarity.CHAOS_TREASURE]: 0.001,     // 混沌灵宝 - 0.001%基础权重
  [EquipmentRarity.CHAOS_SUPREME]: 0.0003,     // 混沌至宝 - 0.0003%基础权重
}

/**
 * 技能稀有度权重配置
 * 权重越高,掉落概率越大
 * 会根据玩家境界动态调整
 */
export const SKILL_RARITY_WEIGHTS = {
  [SkillRarity.YELLOW]: 45,   // 黄阶 - 45%基础权重
  [SkillRarity.DARK]: 30,     // 玄阶 - 30%基础权重
  [SkillRarity.EARTH]: 15,    // 地阶 - 15%基础权重
  [SkillRarity.HEAVEN]: 7,    // 天阶 - 7%基础权重
  [SkillRarity.IMMORTAL]: 2.5, // 仙阶 - 2.5%基础权重
  [SkillRarity.GOD]: 0.5,     // 神阶 - 0.5%基础权重
}
