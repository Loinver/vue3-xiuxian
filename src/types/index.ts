/**
 * 游戏类型定义文件
 * 包含所有游戏相关的类型、接口和枚举定义
 */

// ===== 枚举定义 =====

/**
 * 装备稀有度枚举
 * 从低到高: 凡品 < 黄品 < 玄品 < 地品 < 天品 < 仙品 < 神器
 */
export enum EquipmentRarity {
  COMMON = '凡品',      // 普通品质
  YELLOW = '黄品',      // 黄阶品质
  DARK = '玄品',        // 玄阶品质
  EARTH = '地品',       // 地阶品质
  HEAVEN = '天品',      // 天阶品质
  IMMORTAL = '仙品',    // 仙阶品质
  ARTIFACT = '神器',
  POSTNATAL_TREASURE = "后天灵宝",
  POSTNATAL_SUPREME = "后天至宝",
  INNATE_TREASURE = "先天灵宝",
  INNATE_SUPREME = "先天至宝",
  CHAOS_TREASURE = "混沌灵宝",
  CHAOS_SUPREME = "混沌至宝",
}

/**
 * 装备品质枚举
 * 同一稀有度下的品质等级
 */
export enum EquipmentQuality {
  LOW = '下品',        // 下品 (70-85%)
  MEDIUM = '中品',     // 中品 (85-92%)
  HIGH = '上品',       // 上品 (92-100%)
  PERFECT = '极品',    // 极品 (100-115%)
}

/**
 * 技能稀有度枚举
 * 从低到高: 黄阶 < 玄阶 < 地阶 < 天阶 < 仙阶 < 神阶
 */
export enum SkillRarity {
  YELLOW = '黄阶',      // 黄阶技能
  DARK = '玄阶',        // 玄阶技能
  EARTH = '地阶',       // 地阶技能
  HEAVEN = '天阶',      // 天阶技能
  IMMORTAL = '仙阶',    // 仙阶技能
  GOD = '神阶',         // 神阶技能
}

/**
 * 装备部位枚举
 * 定义角色可装备的6个部位
 */
export enum EquipmentSlot {
  WEAPON = 'weapon',      // 武器
  ARMOR = 'armor',        // 护甲
  HELMET = 'helmet',      // 头盔
  BOOTS = 'boots',        // 鞋子
  RING = 'ring',          // 戒指
  NECKLACE = 'necklace',  // 项链
}

/**
 * 技能类型枚举
 */
export enum SkillType {
  ACTIVE = 'active',   // 主动技能(需要手动释放或消耗法力)
  PASSIVE = 'passive', // 被动技能(永久生效)
}

// ===== 接口定义 =====

/**
 * 境界配置接口
 * 定义每个修炼境界的基础属性
 */
export interface RealmConfig {
  id: string                           // 境界唯一标识
  name: string                         // 境界名称(如"炼气期")
  levels: number                       // 该境界的小层数(通常为9层)
  cultivationPerLevel: number          // 每小层所需修为值
  breakthroughCost: number             // 大境界突破所需灵石
  breakthroughSuccessRate: number      // 大境界突破成功率(0-1)
  attributeBonus: {                    // 突破至该境界时的属性加成
    hpMax: number                      // 最大生命值加成
    attack: number                     // 攻击力加成
    defense: number                    // 防御力加成
    speed: number                      // 速度加成
  }
}

// 角色属性
export interface PlayerAttributes {
  hp: number
  hpMax: number
  mp: number
  mpMax: number
  attack: number
  defense: number
  speed: number
  critRate: number
  critDamage: number
  dodge: number
  block: number
}

// 境界信息
export interface RealmInfo {
  realmIndex: number
  level: number
  cultivation: number
  cultivationMax: number
  breakthroughFailCount: number
}

// 资源
export interface Resources {
  lingStone: number
  comprehensionPoint: number
  experience: number
  level: number
  enhanceStone?: number  // 强化石
}

// 装备属性
export interface EquipmentAttributes {
  hpMax?: number
  mpMax?: number
  attack?: number
  defense?: number
  speed?: number
  critRate?: number
  critDamage?: number
  dodge?: number
  block?: number
}

// 装备
export interface Equipment {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: EquipmentRarity
  quality: EquipmentQuality
  level: number
  requireRealm: number
  requireRealmLevel: number
  attributes: EquipmentAttributes
  enhanceLevel: number
}

// 技能效果
export interface SkillEffect {
  type: 'damage' | 'buff' | 'debuff' | 'heal'
  value: number
  duration?: number
}

// 技能
export interface Skill {
  id: string
  name: string
  type: SkillType
  rarity: SkillRarity
  level: number
  maxLevel: number
  manaCost?: number
  cooldown?: number
  effect: SkillEffect
  description: string
  passive?: EquipmentAttributes
  learnCost: {
    lingStone: number
    needSecretBook: boolean
  }
  upgradeCost: {
    comprehensionPoint: number
    lingStone: number
  }
}

// 装备栏
export interface EquipmentSlots {
  [EquipmentSlot.WEAPON]: Equipment | null
  [EquipmentSlot.ARMOR]: Equipment | null
  [EquipmentSlot.HELMET]: Equipment | null
  [EquipmentSlot.BOOTS]: Equipment | null
  [EquipmentSlot.RING]: Equipment | null
  [EquipmentSlot.NECKLACE]: Equipment | null
}

// 技能栏
export interface SkillSlots {
  active: Skill[]
  passive: Skill[]
}

// 背包物品
export interface InventoryItem {
  id: string
  name: string
  type: 'equipment' | 'skillBook' | 'material'
  rarity: string
  quantity: number
  data?: Equipment | Skill | any
}

// 背包
export interface Inventory {
  equipments: Equipment[]
  skillBooks: Skill[]
  maxSize: number
}

// 战斗信息
export interface BattleInfo {
  currentMapIndex: number
  autoMeditate: boolean
  autoBattle: boolean
  killCount: number
  deathCount: number
  totalDamage: number
}

// 离线信息
export interface OfflineInfo {
  lastOnlineTime: number
  maxOfflineHours: number
}

// 怪物配置
export interface MonsterConfig {
  id: string
  name: string
  map: string
  level: number
  requireRealm: number
  requireRealmLevel: number
  attributes: PlayerAttributes
  isBoss?: boolean  // 是否为Boss怪物
  dropTable: {
    comprehensionPoint?: number[]
    lingStone: [number, number]
    experience: [number, number]
    enhanceStone?: [number, number]  // 强化石掉落范围
    equipmentRate: number
    skillBookRate: number
  }
}

// 地图配置
export interface MapConfig {
  id: string
  name: string
  description: string
  requireRealm: number
  requireRealmLevel: number
  monsters: string[]
}

// 玩家数据
export interface PlayerData {
  id: string
  name: string
  createTime: number
  lastLoginTime: number
  realm: RealmInfo
  attributes: PlayerAttributes
  resources: Resources
  equipment: EquipmentSlots
  skills: SkillSlots
  inventory: Inventory
  battle: BattleInfo
  offline: OfflineInfo
}

// 战斗结果
export interface BattleResult {
  isWin: boolean
  rounds: number
  remainingHP: number
  battleLog: string[]
  rewards?: BattleRewards
}

// 战斗回合记录
export interface BattleRound {
  round: number
  attacker: string
  skill?: string
  damage: number
  isCrit: boolean
  remainingHP: number
}

// 战斗奖励
export interface BattleRewards {
  lingStone: number
  experience: number
  comprehensionPoint: number
  enhanceStone?: number  // 强化石
  equipments: Equipment[]
  skillBooks: Skill[]
}

// 游戏配置
export interface GameConfig {
  realms: RealmConfig[]
  monsters: MonsterConfig[]
  maps: MapConfig[]
}
