import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { PlayerData, Equipment, Skill, MonsterConfig, BattleRewards, BattleRound } from '@/types/game'
import { EquipmentSlot, SkillType, EquipmentQuality } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'
import { MEDITATION_SPEED, BATTLE_CONFIG, OFFLINE_CONFIG, DROP_CONFIG } from '@/config/game'
import { gameStorage } from '@/utils/storage'
import { generateEquipment, generateSkill } from '@/utils/generator'
import { calculateEquipmentSellPrice } from '@/utils/equipment'
import UI from '@/utils/ui'

export const useGameStore = defineStore('game', () => {
  // ===== 状态 =====
  const player = ref<PlayerData | null>(null)
  const isGameRunning = ref(false)
  const currentMonster = ref<MonsterConfig | null>(null)
  const battleLog = ref<string[]>([])

  // 使用 ref 管理定时器，便于追踪和清理
  const meditationTimer = ref<number | null>(null)
  const battleTimer = ref<number | null>(null)

  // ===== 计算属性 =====
  const currentRealm = computed(() => {
    if (!player.value) return null
    return gameConfig.realms[player.value.realm.realmIndex]
  })

  const currentMap = computed(() => {
    if (!player.value) return null
    return gameConfig.maps[player.value.battle.currentMapIndex]
  })

  const availableMaps = computed(() => {
    if (!player.value) return []
    return gameConfig.maps.filter(map => {
      const realm = player.value!.realm
      return realm.realmIndex > map.requireRealm ||
        (realm.realmIndex === map.requireRealm && realm.level >= map.requireRealmLevel)
    })
  })

  // 计算总属性(基础+装备+技能) - 使用缓存优化性能
  const cachedTotalAttributes = ref<PlayerData['attributes'] | null>(null)

  // 计算属性的辅助函数
  function calculateTotalAttributes() {
    if (!player.value) return null
    const base = { ...player.value.attributes }

    // 装备加成
    Object.values(player.value.equipment).forEach((eq: Equipment | null) => {
      if (eq && eq.attributes) {
        Object.entries(eq.attributes).forEach(([key, value]) => {
          if (value && key in base) {
            // 类型安全的属性累加
            const attrKey = key as keyof typeof base
            if (typeof base[attrKey] === 'number' && typeof value === 'number') {
              ;(base[attrKey] as number) += value
            }
          }
        })
      }
    })

    // 被动技能加成
    if (player.value.skills && player.value.skills.passive) {
      player.value.skills.passive.forEach((skill: Skill) => {
        if (skill.passive) {
          Object.entries(skill.passive).forEach(([key, value]) => {
            if (value && key in base) {
              // 类型安全的属性累加
              const attrKey = key as keyof typeof base
              if (typeof base[attrKey] === 'number' && typeof value === 'number') {
                ;(base[attrKey] as number) += value
              }
            }
          })
        }
      })
    }

    return base
  }

  // 监听装备和技能变化，只在必要时重新计算
  watch(
    () => player.value && {
      equipment: player.value.equipment,
      skills: player.value.skills,
      attributes: player.value.attributes
    },
    () => {
      cachedTotalAttributes.value = calculateTotalAttributes()
    },
    { deep: true, immediate: true }
  )

  const totalAttributes = computed(() => cachedTotalAttributes.value)

  // ===== 初始化 =====
  async function initGame() {
    await gameStorage.init()
    const savedPlayer = await gameStorage.loadPlayer()

    if (savedPlayer) {
      player.value = migratePlayerData(savedPlayer)
    } else {
      player.value = createNewPlayer()
      await saveGame()
    }
  }

  /**
   * 数据迁移函数 - 为旧存档添加品质字段
   */
  function migratePlayerData(data: PlayerData): PlayerData {
    // 为所有装备添加默认品质(如果没有)
    const migrateEquipment = (eq: Equipment | null): Equipment | null => {
      if (!eq) return null
      if (!eq.quality) {
        eq.quality = EquipmentQuality.MEDIUM // 默认中品
      }
      return eq
    }

    // 迁移装备栏
    Object.keys(data.equipment).forEach(slot => {
      data.equipment[slot as EquipmentSlot] = migrateEquipment(data.equipment[slot as EquipmentSlot])
    })

    // 迁移背包装备
    if (data.inventory?.equipments) {
      data.inventory.equipments = data.inventory.equipments.map(eq => migrateEquipment(eq)!)
    }

    return data
  }

  function createNewPlayer(): PlayerData {
    return {
      id: `player_${Date.now()}`,
      name: '道友',
      createTime: Date.now(),
      lastLoginTime: Date.now(),
      realm: {
        realmIndex: 0,
        level: 1,
        cultivation: 0,
        cultivationMax: 10000,
        breakthroughFailCount: 0
      },
      attributes: {
        hp: 80, hpMax: 80, mp: 20, mpMax: 20,
        attack: 8, defense: 4, speed: 6,
        critRate: 0.05, critDamage: 1.5, dodge: 0.03, block: 0.02
      },
      resources: {
        lingStone: 100,
        comprehensionPoint: 0,
        experience: 0,
        level: 1,
        enhanceStone: 0
      },
      equipment: {
        [EquipmentSlot.WEAPON]: null,
        [EquipmentSlot.ARMOR]: null,
        [EquipmentSlot.HELMET]: null,
        [EquipmentSlot.BOOTS]: null,
        [EquipmentSlot.RING]: null,
        [EquipmentSlot.NECKLACE]: null
      },
      skills: {
        active: [],
        passive: []
      },
      inventory: {
        equipments: [],
        skillBooks: [],
        maxSize: 500
      },
      battle: {
        currentMapIndex: 0,
        autoMeditate: true,
        autoBattle: true,
        killCount: 0,
        deathCount: 0,
        totalDamage: 0
      },
      offline: {
        lastOnlineTime: Date.now(),
        maxOfflineHours: OFFLINE_CONFIG.maxOfflineHours
      }
    }
  }

  // ===== 存档 =====
  async function saveGame() {
    if (player.value) {
      player.value.offline.lastOnlineTime = Date.now()
      await gameStorage.savePlayer(player.value)
    }
  }

  // ===== 挂机系统 =====
  function resumeIdle() {
    if (!player.value || isGameRunning.value) return
    isGameRunning.value = true

    // 打坐修炼
    if (player.value.battle.autoMeditate) {
      startMeditation()
    }

    // 自动战斗
    if (player.value.battle.autoBattle) {
      startBattle()
    }
  }

  function pauseIdle() {
    isGameRunning.value = false

    // 清理打坐定时器
    if (meditationTimer.value !== null) {
      clearInterval(meditationTimer.value)
      meditationTimer.value = null
    }

    // 清理战斗定时器
    if (battleTimer.value !== null) {
      clearInterval(battleTimer.value)
      battleTimer.value = null
    }
  }

  // 打坐修炼
  function startMeditation() {
    if (meditationTimer.value !== null) return

    meditationTimer.value = setInterval(() => {
      if (player.value) {
        const rate = MEDITATION_SPEED.baseRate * (1 + player.value.realm.realmIndex * MEDITATION_SPEED.realmMultiplier)
        player.value.realm.cultivation = Math.floor(player.value.realm.cultivation + rate)
      }
    }, MEDITATION_SPEED.interval) as unknown as number
  }

  // 自动战斗
  function startBattle() {
    if (battleTimer.value !== null) return

    battleTimer.value = setInterval(() => {
      if (player.value && player.value.attributes.hp > 0) {
        performBattle()
      }
    }, BATTLE_CONFIG.battleInterval) as unknown as number
  }

  // 执行战斗 - 新增回合制战斗系统
  function performBattle() {
    if (!player.value || !currentMap.value) return

    // 随机选择怪物（Boss出现概率）
    const monsterIds = currentMap.value.monsters
    const monsters = gameConfig.monsters.filter(m => monsterIds.includes(m.id))

    // Boss有10%概率出现
    const bossMonsters = monsters.filter(m => m.isBoss)
    const normalMonsters = monsters.filter(m => !m.isBoss)

    let monster: MonsterConfig | undefined
    if (bossMonsters.length > 0 && Math.random() < 0.1) {
      // 随机选择一个Boss
      monster = bossMonsters[Math.floor(Math.random() * bossMonsters.length)]
    } else {
      // 随机选择普通怪物
      monster = normalMonsters[Math.floor(Math.random() * normalMonsters.length)]
    }

    if (!monster) return

    const playerAttr = { ...totalAttributes.value! }
    const monsterAttr = { ...monster.attributes }

    // 初始化战斗状态
    let playerHP = playerAttr.hp
    let monsterHP = monsterAttr.hp
    const battleRounds: BattleRound[] = []
    let round = 0

    // 获取玩家主动技能（随机使用）
    const activeSkills = player.value.skills.active || []

    // 开始回合制战斗
    addBattleLog(`${monster.isBoss ? '⚔️ Boss战斗' : '遭遇'}【${monster.name}】`)

    while (playerHP > 0 && monsterHP > 0 && round < 100) { // 最多100回合防止死循环
      round++

      // 玩家回合
      let playerDamage = 0
      let usedSkill: Skill | null = null
      let playerCrit = false

      // 30%概率使用主动技能
      if (activeSkills.length > 0 && Math.random() < 0.3 && player.value.attributes.mp >= (activeSkills[0].manaCost || 0)) {
        usedSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)]
        if (usedSkill.manaCost) {
          player.value.attributes.mp -= usedSkill.manaCost
        }
        // 技能伤害 = (攻击力 - 防御力) * 技能倍率
        const baseDamage = Math.max(1, playerAttr.attack - monsterAttr.defense)
        playerDamage = Math.floor(baseDamage * (usedSkill.effect.value || 1.5))
      } else {
        // 普通攻击
        playerDamage = Math.max(1, playerAttr.attack - monsterAttr.defense)
      }

      // 暴击判定
      if (Math.random() < playerAttr.critRate) {
        playerCrit = true
        playerDamage = Math.floor(playerDamage * playerAttr.critDamage)
      }

      monsterHP -= playerDamage

      battleRounds.push({
        round,
        attacker: '玩家',
        skill: usedSkill?.name,
        damage: playerDamage,
        isCrit: playerCrit,
        remainingHP: Math.max(0, monsterHP)
      })

      // 构建战斗日志
      let attackLog = `第${round}回合: `
      if (usedSkill) {
        attackLog += `使用【${usedSkill.name}】`
      } else {
        attackLog += '普通攻击'
      }
      attackLog += `对${monster.name}造成${playerDamage}${playerCrit ? '(暴击!)' : ''}伤害`
      if (monsterHP > 0) {
        attackLog += `,剩余${Math.floor(monsterHP)}HP`
      }
      addBattleLog(attackLog)

      if (monsterHP <= 0) break

      // 怪物回合
      let monsterDamage = Math.max(1, monsterAttr.attack - playerAttr.defense)

      // 闪避判定
      if (Math.random() < playerAttr.dodge) {
        addBattleLog(`${monster.name}的攻击被闪避!`)
      } else {
        // 格挡判定
        if (Math.random() < playerAttr.block) {
          monsterDamage = Math.floor(monsterDamage * 0.5)
          playerHP -= monsterDamage
          addBattleLog(`${monster.name}攻击造成${monsterDamage}伤害(格挡!),剩余${Math.floor(playerHP)}HP`)
        } else {
          // 怪物暴击判定
          let monsterCrit = false
          if (Math.random() < monsterAttr.critRate) {
            monsterCrit = true
            monsterDamage = Math.floor(monsterDamage * monsterAttr.critDamage)
          }
          playerHP -= monsterDamage
          addBattleLog(`${monster.name}攻击造成${monsterDamage}${monsterCrit ? '(暴击!)' : ''}伤害,剩余${Math.floor(playerHP)}HP`)
        }
      }

      // 每回合恢复少量法力
      if (player.value.attributes.mp < player.value.attributes.mpMax) {
        player.value.attributes.mp = Math.min(
          player.value.attributes.mpMax,
          player.value.attributes.mp + Math.floor(player.value.attributes.mpMax * 0.05)
        )
      }
    }

    // 更新玩家HP
    player.value.attributes.hp = Math.max(0, playerHP)

    const isWin = monsterHP <= 0

    if (isWin) {
      // 胜利奖励
      const rewards = calculateRewards(monster)
      applyRewards(rewards)
      player.value.battle.killCount++

      // 构建战斗日志
      let logMessage = `✅ 击败${monster.isBoss ? 'Boss' : ''}【${monster.name}】,获得灵石${rewards.lingStone}`
      if (rewards.comprehensionPoint > 0) {
        logMessage += `,悟道点${rewards.comprehensionPoint}`
      }
      if (rewards.enhanceStone && rewards.enhanceStone > 0) {
        logMessage += `,强化石${rewards.enhanceStone}`
      }
      if (rewards.equipments.length > 0) {
        logMessage += `,装备${rewards.equipments.map(eq => `【${eq.name}】`).join('、')}`
      }
      if (rewards.skillBooks.length > 0) {
        logMessage += `,技能书${rewards.skillBooks.map(skill => `【${skill.name}】`).join('、')}`
      }
      addBattleLog(logMessage)
    } else {
      // 失败
      player.value.attributes.hp = 0
      player.value.battle.deathCount++
      addBattleLog(`❌ 被${monster.name}击败`)

      // 自动复活
      setTimeout(() => {
        if (player.value) {
          player.value.attributes.hp = player.value.attributes.hpMax
          player.value.attributes.mp = player.value.attributes.mpMax
          addBattleLog('💚 已复活')
        }
      }, BATTLE_CONFIG.reviveDelay)
    }
  }

  function calculateRewards(monster: MonsterConfig): BattleRewards {
    const [minStone, maxStone] = monster.dropTable.lingStone
    const [minExp, maxExp] = monster.dropTable.experience
    const comprehensionPoint = monster.dropTable.comprehensionPoint || [0, 1]
    const [minComp, maxComp] = comprehensionPoint

    // Boss奖励倍率
    const bossMultiplier = monster.isBoss ? 3 : 1

    // 基础奖励
    const rewards: BattleRewards = {
      lingStone: Math.floor((Math.random() * (maxStone - minStone + 1)) + minStone) * bossMultiplier,
      experience: Math.floor((Math.random() * (maxExp - minExp + 1)) + minExp) * bossMultiplier,
      comprehensionPoint: Math.floor((Math.random() * (maxComp - minComp + 1)) + minComp) * bossMultiplier,
      equipments: [],
      skillBooks: []
    }

    // 强化石掉落
    if (monster.dropTable.enhanceStone) {
      const [minEnhance, maxEnhance] = monster.dropTable.enhanceStone
      rewards.enhanceStone = Math.floor((Math.random() * (maxEnhance - minEnhance + 1)) + minEnhance) * bossMultiplier
    }

    // Boss必掉装备和技能书
    if (monster.isBoss) {
      // Boss必掉1-2件装备
      const equipmentCount = Math.random() < 0.5 ? 2 : 1
      for (let i = 0; i < equipmentCount; i++) {
        const slots = [
          EquipmentSlot.WEAPON,
          EquipmentSlot.ARMOR,
          EquipmentSlot.HELMET,
          EquipmentSlot.BOOTS,
          EquipmentSlot.RING,
          EquipmentSlot.NECKLACE
        ]
        const randomSlot = slots[Math.floor(Math.random() * slots.length)]
        const equipment = generateEquipment(randomSlot, monster.requireRealm, monster.level, true)
        rewards.equipments.push(equipment)
      }

      // Boss必掉1本技能书
      const skillType = Math.random() < DROP_CONFIG.activeSkillRate ? SkillType.ACTIVE : SkillType.PASSIVE
      const skill = generateSkill(skillType, player.value!.realm.realmIndex)
      rewards.skillBooks.push(skill)
    } else {
      // 普通怪物装备掉落判定 - 使用全局配置的爆率
      const equipmentDropRate = DROP_CONFIG.equipmentBaseRate

      if (Math.random() < equipmentDropRate) {
        const slots = [
          EquipmentSlot.WEAPON,
          EquipmentSlot.ARMOR,
          EquipmentSlot.HELMET,
          EquipmentSlot.BOOTS,
          EquipmentSlot.RING,
          EquipmentSlot.NECKLACE
        ]
        const randomSlot = slots[Math.floor(Math.random() * slots.length)]

        // 使用怪物的境界需求作为地图等级，启用地图限制模式
        const equipment = generateEquipment(randomSlot, monster.requireRealm, monster.level, true)
        rewards.equipments.push(equipment)
      }

      // 技能书掉落判定 - 使用全局配置的爆率
      const skillBookDropRate = DROP_CONFIG.skillBookBaseRate

      if (Math.random() < skillBookDropRate) {
        // 根据配置的比例决定主动还是被动技能
        const skillType = Math.random() < DROP_CONFIG.activeSkillRate ? SkillType.ACTIVE : SkillType.PASSIVE
        const skill = generateSkill(skillType, player.value!.realm.realmIndex)
        rewards.skillBooks.push(skill)
      }
    }

    return rewards
  }

  function applyRewards(rewards: BattleRewards) {
    if (!player.value) return
    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone + rewards.lingStone)
    player.value.resources.experience = Math.floor(player.value.resources.experience + rewards.experience)
    player.value.resources.comprehensionPoint = Math.floor(player.value.resources.comprehensionPoint + rewards.comprehensionPoint)

    // 应用强化石奖励
    if (rewards.enhanceStone && rewards.enhanceStone > 0) {
      player.value.resources.enhanceStone = Math.floor((player.value.resources.enhanceStone || 0) + rewards.enhanceStone)
    }

    // 将装备加入背包
    if (rewards.equipments.length > 0) {
      rewards.equipments.forEach(eq => {
        if (player.value!.inventory.equipments.length < player.value!.inventory.maxSize) {
          player.value!.inventory.equipments.push(eq)
        }
      })
    }

    // 将技能书加入背包
    if (rewards.skillBooks.length > 0) {
      rewards.skillBooks.forEach(skill => {
        if (player.value!.inventory.skillBooks.length < player.value!.inventory.maxSize) {
          player.value!.inventory.skillBooks.push(skill)
        }
      })
    }
  }

  function addBattleLog(message: string) {
    battleLog.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
    // 保持日志数量在限制内，删除旧的日志
    if (battleLog.value.length > BATTLE_CONFIG.maxBattleLog) {
      battleLog.value.splice(0, battleLog.value.length - BATTLE_CONFIG.maxBattleLog)
    }
  }

  // GM操作
  function GM() {

    if (!player.value) return
    player.value.resources.lingStone += 1000000000000000;
    player.value.resources.comprehensionPoint += 100;

  }

  // ===== 装备出售 =====
  function sellEquipment(equipment: Equipment): number {
    if (!player.value) return 0

    const sellPrice = calculateEquipmentSellPrice(equipment)

    // 增加灵石
    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone + sellPrice)

    // 从背包移除装备 - 使用 findIndex 而不是 indexOf 来避免引用比较问题
    const index = player.value.inventory.equipments.findIndex(eq => eq.id === equipment.id)
    if (index > -1) {
      player.value.inventory.equipments.splice(index, 1)
    }

    saveGame()
    return sellPrice
  }

  // ===== 技能书出售 =====
  function sellSkill(skill: Skill): number {
    if (!player.value) return 0

    // 计算售价为学习消耗的50%
    const sellPrice = Math.floor(skill.learnCost.lingStone * 0.5)

    // 增加灵石
    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone + sellPrice)

    // 从背包移除技能书
    const index = player.value.inventory.skillBooks.findIndex(s => s.id === skill.id)
    if (index > -1) {
      player.value.inventory.skillBooks.splice(index, 1)
    }

    saveGame()
    return sellPrice
  }

  // ===== 装备强化 =====
  function enhanceEquipment(equipment: Equipment): { success: boolean; message: string } {
    if (!player.value) return { success: false, message: '玩家数据错误' }

    const currentLevel = equipment.enhanceLevel || 0

    // 强化上限为20级
    if (currentLevel >= 20) {
      return { success: false, message: '已达到强化上限(+20)' }
    }

    // 计算强化消耗
    const stoneCost = Math.floor(10 * Math.pow(1.5, currentLevel))
    const lingStoneCost = Math.floor(100 * Math.pow(2, currentLevel))

    // 检查资源是否足够
    if ((player.value.resources.enhanceStone || 0) < stoneCost) {
      return { success: false, message: `强化石不足,需要${stoneCost}个` }
    }
    if (player.value.resources.lingStone < lingStoneCost) {
      return { success: false, message: `灵石不足,需要${lingStoneCost}` }
    }

    // 计算成功率（强化等级越高成功率越低）
    const baseSuccessRate = 1.0 - (currentLevel * 0.04) // 从100%递减到20%
    const successRate = Math.max(0.2, baseSuccessRate)

    // 扣除消耗
    player.value.resources.enhanceStone! -= stoneCost
    player.value.resources.lingStone -= lingStoneCost

    // 判断是否成功
    if (Math.random() < successRate) {
      // 强化成功
      equipment.enhanceLevel = currentLevel + 1

      // 提升装备属性 (每级提升5%)
      const enhanceBonus = 0.05
      if (equipment.attributes.attack) {
        equipment.attributes.attack = Math.floor(equipment.attributes.attack * (1 + enhanceBonus))
      }
      if (equipment.attributes.defense) {
        equipment.attributes.defense = Math.floor(equipment.attributes.defense * (1 + enhanceBonus))
      }
      if (equipment.attributes.hpMax) {
        equipment.attributes.hpMax = Math.floor(equipment.attributes.hpMax * (1 + enhanceBonus))
      }
      if (equipment.attributes.mpMax) {
        equipment.attributes.mpMax = Math.floor(equipment.attributes.mpMax * (1 + enhanceBonus))
      }
      if (equipment.attributes.speed) {
        equipment.attributes.speed = Math.floor(equipment.attributes.speed * (1 + enhanceBonus))
      }

      saveGame()
      return {
        success: true,
        message: `强化成功!【${equipment.name}】现在为+${equipment.enhanceLevel}`
      }
    } else {
      // 强化失败
      // 10级以上失败会降级
      if (currentLevel >= 10) {
        equipment.enhanceLevel = Math.max(0, currentLevel - 1)
        return {
          success: false,
          message: `强化失败!【${equipment.name}】降低至+${equipment.enhanceLevel}`
        }
      } else {
        return {
          success: false,
          message: `强化失败!【${equipment.name}】等级未变`
        }
      }
    }
  }

  // 计算强化消耗（用于UI显示）
  function getEnhanceCost(equipment: Equipment): { stoneCost: number; lingStoneCost: number; successRate: number } {
    const currentLevel = equipment.enhanceLevel || 0
    const stoneCost = Math.floor(10 * Math.pow(1.5, currentLevel))
    const lingStoneCost = Math.floor(100 * Math.pow(2, currentLevel))
    const baseSuccessRate = 1.0 - (currentLevel * 0.04)
    const successRate = Math.max(0.2, baseSuccessRate)

    return { stoneCost, lingStoneCost, successRate }
  }

  // 计算怪物掉落率（用于UI显示）
  function getMonsterDropRates(monster: MonsterConfig) {
    if (monster.isBoss) {
      // Boss必掉装备和技能书
      return {
        equipmentRate: monster.dropTable.equipmentRate,
        skillBookRate: monster.dropTable.skillBookRate,
        enhanceStoneRate: monster.dropTable.enhanceStone ? 1.0 : 0,  // 只有配置了才显示100%
        equipmentCount: '1-2',
        skillBookCount: '1',
        enhanceStoneRange: monster.dropTable.enhanceStone ? `${monster.dropTable.enhanceStone[0]}-${monster.dropTable.enhanceStone[1]}` : '0'
      }
    } else {
      // 普通怪物 - 直接使用怪物配置中的爆率
      return {
        equipmentRate: monster.dropTable.equipmentRate,
        skillBookRate: monster.dropTable.skillBookRate,
        enhanceStoneRate: monster.dropTable.enhanceStone ? 1.0 : 0,
        equipmentCount: '1',
        skillBookCount: '1',
        enhanceStoneRange: monster.dropTable.enhanceStone ? `${monster.dropTable.enhanceStone[0]}-${monster.dropTable.enhanceStone[1]}` : '0'
      }
    }
  }


  // ===== 境界突破 =====
  function breakthrough() {
    if (!player.value || !currentRealm.value) return { success: false, message: '境界信息错误' }

    const realm = player.value.realm
    const config = currentRealm.value

    // 检查是否满足条件
    if (realm.cultivation < realm.cultivationMax) {
      return { success: false, message: `修为不足,还需${realm.cultivationMax - realm.cultivation}` }
    }

    if (player.value.resources.lingStone < config.breakthroughCost) {
      return { success: false, message: `灵石不足,还需${config.breakthroughCost - player.value.resources.lingStone}` }
    }

    // 小境界突破
    if (realm.level < config.levels) {
      // 保留超出上限的修为
      const excessCultivation = Math.floor(realm.cultivation - realm.cultivationMax)

      realm.level++
      realm.cultivation = Math.max(0, excessCultivation)
      realm.cultivationMax = config.cultivationPerLevel
      player.value.resources.lingStone -= config.breakthroughCost

      // 属性提升
      player.value.attributes.hpMax += Math.floor(config.attributeBonus.hpMax / config.levels)
      player.value.attributes.attack += Math.floor(config.attributeBonus.attack / config.levels)
      player.value.attributes.defense += Math.floor(config.attributeBonus.defense / config.levels)
      player.value.attributes.speed += Math.floor(config.attributeBonus.speed / config.levels)
      player.value.attributes.hp = player.value.attributes.hpMax

      saveGame()
      return { success: true, message: `突破成功!当前${config.name}${realm.level}层` }
    }

    // 大境界突破
    if (realm.realmIndex < gameConfig.realms.length - 1) {
      const success = Math.random() < config.breakthroughSuccessRate
      player.value.resources.lingStone -= config.breakthroughCost

      if (success) {
        // 保留超出上限的修为
        const excessCultivation = Math.floor(realm.cultivation - realm.cultivationMax)

        realm.realmIndex++
        realm.level = 1
        realm.cultivation = Math.max(0, excessCultivation)
        realm.breakthroughFailCount = 0

        const nextRealm = gameConfig.realms[realm.realmIndex]
        realm.cultivationMax = nextRealm.cultivationPerLevel

        // 大幅属性提升
        player.value.attributes.hpMax += nextRealm.attributeBonus.hpMax
        player.value.attributes.attack += nextRealm.attributeBonus.attack
        player.value.attributes.defense += nextRealm.attributeBonus.defense
        player.value.attributes.speed += nextRealm.attributeBonus.speed
        player.value.attributes.hp = player.value.attributes.hpMax

        saveGame()
        return { success: true, message: `恭喜突破至${nextRealm.name}!` }
      } else {
        realm.breakthroughFailCount++
        return { success: false, message: `突破失败,已失败${realm.breakthroughFailCount}次` }
      }
    }

    return { success: false, message: '已达最高境界' }
  }

  // ===== 离线收益 =====
  function calculateOfflineRewards() {
    if (!player.value) return

    const now = Date.now()
    const lastOnline = player.value.offline.lastOnlineTime
    const offlineTime = Math.min(
      now - lastOnline,
      player.value.offline.maxOfflineHours * 3600 * 1000
    )

    if (offlineTime < OFFLINE_CONFIG.minOfflineTime) return // 少于最小时间不计算

    const hours = offlineTime / 3600000
    const efficiency = OFFLINE_CONFIG.offlineEfficiency

    // 修为收益
    const meditationRate = MEDITATION_SPEED.baseRate * (1 + player.value.realm.realmIndex * MEDITATION_SPEED.realmMultiplier)
    const cultivation = Math.floor(meditationRate * (offlineTime / MEDITATION_SPEED.interval) * efficiency)

    // 战斗收益
    const battleCount = Math.floor((offlineTime / BATTLE_CONFIG.battleInterval) * efficiency)
    const lingStone = Math.floor(battleCount * BATTLE_CONFIG.offlineBattleReward)

    player.value.realm.cultivation = Math.floor(player.value.realm.cultivation + cultivation)
    player.value.resources.lingStone = Math.floor(player.value.resources.lingStone + lingStone)

    UI.toast({
      title: `离线收益:修为+${cultivation},灵石+${lingStone}`,
      icon: 'none',
      duration: 3000
    })
  }

  // ===== 工具函数 =====
  function formatNumber(num: number): string {
    num = Math.floor(num) // 确保是整数
    if (num >= 100000000) {
      const value = num / 100000000
      return value % 1 === 0 ? `${value}亿` : `${value.toFixed(2)}亿`
    }
    if (num >= 10000) {
      const value = num / 10000
      return value % 1 === 0 ? `${value}万` : `${value.toFixed(2)}万`
    }
    return num.toString()
  }

  // ===== 重置游戏 =====
  async function resetGame() {
    // 停止所有定时器
    pauseIdle()

    // 清空状态
    player.value = null
    isGameRunning.value = false
    currentMonster.value = null
    battleLog.value = []

    // 清空本地存储
    await gameStorage.clearPlayer()

    // 重新初始化数据库和游戏
    await gameStorage.init()

    // 创建新玩家
    player.value = createNewPlayer()
    await saveGame()
  }

  return {
    // 状态
    player,
    isGameRunning,
    currentMonster,
    battleLog,

    // 计算属性
    currentRealm,
    currentMap,
    availableMaps,
    totalAttributes,

    // 方法
    initGame,
    saveGame,
    resumeIdle,
    pauseIdle,
    breakthrough,
    calculateOfflineRewards,
    formatNumber,
    GM,
    sellEquipment,
    sellSkill,
    enhanceEquipment,
    getEnhanceCost,
    getMonsterDropRates,
    resetGame
  }
})
