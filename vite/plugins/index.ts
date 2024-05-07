import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import appInfo from './app-info'

import createDevtools from './devtools'
import createAutoImport from './auto-import'
import createComponents from './components'
import createUnocss from './unocss'
import createSvgIcon from './svg-icon'
import createMock from './mock'
import createLayouts from './layouts'
import createPages from './pages'
import createCompression from './compression'
import createArchiver from './archiver'
import createConsole from './console'
import createBanner from './banner'

export default function createVitePlugins(viteEnv, isBuild = false) {
  const vitePlugins: (PluginOption | PluginOption[])[] = [
    appInfo(),
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ]
  vitePlugins.push(createDevtools(viteEnv))
  vitePlugins.push(createAutoImport())
  vitePlugins.push(createComponents())
  vitePlugins.push(createUnocss())
  vitePlugins.push(createSvgIcon(isBuild))
  vitePlugins.push(createMock(viteEnv, isBuild))
  vitePlugins.push(createLayouts())
  vitePlugins.push(createPages())
  vitePlugins.push(...createCompression(viteEnv, isBuild))
  vitePlugins.push(createArchiver(viteEnv))
  vitePlugins.push(createConsole())
  vitePlugins.push(createBanner())
  return vitePlugins
}
