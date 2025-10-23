/**
 * UI 工具类
 * 直接使用 Vant UI 组件
 */

import { showToast as vantShowToast, showDialog, showLoadingToast, closeToast } from 'vant'

export class UI {
  /**
   * 显示 Toast 提示
   */
  static toast(options: {
    title: string
    icon?: 'success' | 'none' | 'loading' | 'error'
    duration?: number
  }) {
    const { title, icon = 'none', duration = 2000 } = options

    if (icon === 'loading') {
      showLoadingToast({
        message: title,
        forbidClick: true,
        duration: 0,
      })
    } else {
      vantShowToast({
        message: title,
        duration,
        ...(icon === 'success' && { icon: 'success' }),
        ...(icon === 'error' && { icon: 'fail' }),
      })
    }
  }

  /**
   * 显示模态对话框
   */
  static modal(options: {
    title?: string
    content: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
  }): Promise<{ confirm: boolean; cancel: boolean }> {
    const {
      title = '提示',
      content,
      showCancel = true,
      cancelText = '取消',
      confirmText = '确定',
    } = options

    return new Promise((resolve) => {
      showDialog({
        title,
        message: content,
        showCancelButton: showCancel,
        cancelButtonText: cancelText,
        confirmButtonText: confirmText,
      })
        .then(() => {
          resolve({ confirm: true, cancel: false })
        })
        .catch(() => {
          resolve({ confirm: false, cancel: true })
        })
    })
  }

  /**
   * 显示加载提示
   */
  static loading(title: string) {
    showLoadingToast({
      message: title,
      forbidClick: true,
      duration: 0,
    })
  }

  /**
   * 隐藏加载提示
   */
  static hideLoading() {
    closeToast()
  }
}

export default UI
