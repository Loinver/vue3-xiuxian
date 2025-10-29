import type { PlayerData } from '@/types/game'

const DB_NAME = 'XiuXianGame'
const DB_VERSION = 1
const STORE_NAME = 'gameData'

class GameStorage {
  private db: IDBDatabase | null = null

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB打开失败')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }
    })
  }

  // 保存玩家数据
  async savePlayer(playerData: PlayerData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      try {
        // 深拷贝数据,确保可以被JSON序列化
        const clonedData = JSON.parse(JSON.stringify(playerData))

        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put({
          key: 'player',
          data: clonedData,
          timestamp: Date.now()
        })

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = () => {
          console.error('玩家数据保存失败', request.error)
          reject(request.error)
        }
      } catch (error) {
        console.error('数据序列化失败', error)
        reject(error)
      }
    })
  }

  // 加载玩家数据
  async loadPlayer(): Promise<PlayerData | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('player')

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error('玩家数据加载失败')
        reject(request.error)
      }
    })
  }

  // 删除玩家数据
  async deletePlayer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete('player')

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('玩家数据删除失败')
        reject(request.error)
      }
    })
  }

  // 保存游戏设置（使用泛型）
  async saveSetting<T = unknown>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ key: `setting_${key}`, data: value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 加载游戏设置（使用泛型）
  async loadSetting<T = unknown>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(`setting_${key}`)

      request.onsuccess = () => {
        resolve(request.result?.data || null)
      }

      request.onerror = () => reject(request.error)
    })
  }

  // 清空玩家数据(重置游戏用)
  async clearPlayer(): Promise<void> {
    return this.deletePlayer()
  }
}

export const gameStorage = new GameStorage()
