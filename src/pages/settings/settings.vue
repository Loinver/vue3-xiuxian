<template>
  <div class="settings-page">
    <div class="card">
      <div class="card-title">角色信息</div>
      <div class="info-item">
        <span class="info-label">角色名称</span>
        <div class="info-value">
          <span>{{ gameStore.player?.name }}</span>
          <button class="btn-small" size="mini" @click="handleChangeName">
            修改
          </button>
        </div>
      </div>
      <div class="info-item">
        <span class="info-label">创建时间</span>
        <span class="info-value">{{
          formatDate(gameStore.player?.createTime)
        }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">游戏时长</span>
        <span class="info-value">{{ playTime }}</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">游戏设置</div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-name">自动保存</span>
          <span class="setting-desc">每30秒自动保存游戏进度</span>
        </div>
        <van-switch v-model="autoSave" @update:model-value="toggleAutoSave" color="#f4a460" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">数据管理</div>
      <button class="btn btn-primary" @click="handleExportData">
        导出存档
      </button>
      <button class="btn btn-secondary" @click="handleImportData">
        导入存档
      </button>
      <button class="btn btn-danger" @click="handleResetGame">重置游戏</button>
    </div>

    <div class="card">
      <div class="card-title">关于</div>
      <div class="info-item">
        <span class="info-label">游戏版本</span>
        <span class="info-value">v1.0.0</span>
      </div>
      <div class="info-item">
        <span class="info-label">制作</span>
        <span class="info-value">修仙挂机</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { useGameStore } from "@/stores/game";
  import UI from "@/utils/ui";

  const gameStore = useGameStore();
  const autoSave = ref(true);
  let autoSaveTimer: number | null = null;

  const playTime = computed(() => {
    if (!gameStore.player) return "0小时";
    const now = Date.now();
    const playTimeMs = now - gameStore.player.createTime;
    const hours = Math.floor(playTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((playTimeMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  });

  function formatDate(timestamp?: number): string {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  async function handleChangeName() {
    const res = await UI.modal({
      title: "修改角色名称",
      content: "请输入新名称(不超过10个字)"
    })

    if (res.confirm && gameStore.player) {
      // Note: Vant dialog doesn't support editable text input in showDialog
      // We'll need to use a different approach or just show a message
      UI.toast({ title: "请使用导入/导出功能修改名称", icon: "none" })
    }
  }

  function toggleAutoSave(value: boolean) {
    autoSave.value = value;
    if (autoSave.value) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
  }

  function startAutoSave() {
    if (autoSaveTimer) return;
    autoSaveTimer = setInterval(() => {
      gameStore.saveGame();
    }, 30000) as unknown as number;
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function handleExportData() {
    if (!gameStore.player) return;

    const data = JSON.stringify(gameStore.player, null, 2);

    // 创建下载链接
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xiuxian_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    UI.toast({ title: "导出成功", icon: "success" });
  }

  async function handleImportData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // 这里可以添加数据验证
          const res = await UI.modal({
            title: "确认导入",
            content: "导入存档将覆盖当前游戏数据，是否继续？"
          })

          if (res.confirm) {
            gameStore.player = data;
            gameStore.saveGame();
            gameStore.pauseIdle();
            gameStore.resumeIdle();
            UI.toast({ title: "导入成功", icon: "success" });
          }
        } catch (error) {
          UI.toast({ title: "文件格式错误", icon: "none" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async function handleResetGame() {
    const res = await UI.modal({
      title: "重置游戏",
      content: "确定要重置游戏吗？所有数据将被清除，此操作不可恢复！",
      confirmText: "确定重置",
      cancelText: "取消"
    })

    if (res.confirm) {
      try {
        // 使用store的resetGame方法
        await gameStore.resetGame();
        // 等待一下确保数据重置完成
        await new Promise((resolve) => setTimeout(resolve, 100));
        // 重新启动游戏
        gameStore.resumeIdle();
        UI.toast({ title: "游戏已重置", icon: "success" });
      } catch (error) {
        console.error("重置游戏失败", error);
        UI.toast({ title: "重置失败，请重试", icon: "none" });
      }
    }
  }

  onMounted(() => {
    if (autoSave.value) {
      startAutoSave();
    }
  });

  onUnmounted(() => {
    stopAutoSave();
  });
</script>

<style scoped>
  .settings-page {
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

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 11px;
    border-bottom: 1px solid #f5f5f5;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    color: #666;
  }

  .info-value {
    color: #1a1a2e;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .setting-info {
    flex: 1;
  }

  .setting-name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 3px;
    color: #1a1a2e;
  }

  .setting-desc {
    display: block;
    font-size: 10px;
    color: #999;
  }

  .btn {
    width: 100%;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    padding: 10px 16px;
    font-weight: bold;
    margin-bottom: 6px;
    transition: all 0.3s;
    cursor: pointer;
    line-height: 1.4;
  }

  .btn:last-child {
    margin-bottom: 0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(244, 164, 96, 0.3);
  }

  .btn-primary:active {
    opacity: 0.8;
    transform: scale(0.98);
  }

  .btn-secondary {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
  }

  .btn-secondary:active {
    opacity: 0.8;
    transform: scale(0.98);
  }

  .btn-danger {
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    color: white;
    box-shadow: 0 2px 6px rgba(255, 77, 79, 0.3);
  }

  .btn-danger:active {
    opacity: 0.8;
    transform: scale(0.98);
  }

  .btn-small {
    background: linear-gradient(135deg, #f4a460 0%, #ff8c42 100%);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    line-height: 1.2;
  }

  .btn-small:active {
    opacity: 0.8;
  }
</style>
