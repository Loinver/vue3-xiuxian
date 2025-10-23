import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Vant 样式
import 'vant/lib/index.css'
// 触摸模拟器（用于桌面调试）
import '@vant/touch-emulator'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
