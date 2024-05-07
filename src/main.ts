import './utils/system.copyright'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import pinia from './store'
import router from './router'
// 加载 svg 图标
import 'virtual:svg-icons-register'

import 'virtual:uno.css'

// 全局样式
import '@/assets/styles/globals.scss'

const app = createApp(App)
app.use(pinia)
app.use(router)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
