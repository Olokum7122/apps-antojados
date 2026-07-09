import { defineConfig } from '#q-app/wrappers'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '../..')
const sharedRoot = resolve(workspaceRoot, 'shared')
const uiSharedRoot = resolve(sharedRoot, 'ui')
const httpSharedRoot = resolve(sharedRoot, 'http')
const apiSharedRoot = resolve(sharedRoot, 'api')
const quasarWrappers = resolve(__dirname, 'node_modules/@quasar/app-vite/exports/wrappers/wrappers.js')

export default defineConfig((/* ctx */) => {
  return {
    boot: ['theme-manager', 'card-viewport-boot', 'axios'],
    css: ['app.scss', 'indexclasses.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      target: { browser: 'baseline-widely-available', node: 'node22' },
      vueRouterMode: 'hash',
      beforeBuild: async () => {
        const { execSync } = await import('node:child_process');
        console.log('[quasar] Sincronizando cards desde shared/ui/cards/...');
        execSync('node ' + resolve(workspaceRoot, 'scripts/sync-cards.mjs'), { stdio: 'inherit' });
      },
      viteVuePluginOptions: {
        template: {
          compilerOptions: {
            isCustomElement: (tag) => ['card-viewport'].includes(tag)
          }
        }
      },
      vitePlugins: [
        ['vite-plugin-checker', {
          eslint: { lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"', useFlatConfig: true }
        }, { server: false }]
      ],
      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = [
          ...(Array.isArray(viteConf.resolve.alias) ? viteConf.resolve.alias : []),
          { find: '#q-app/wrappers', replacement: quasarWrappers },
          { find: /^app\/(.*)$/, replacement: `${__dirname}/$1` },
          { find: /^boot\/(.*)$/, replacement: `${resolve(__dirname, 'src/boot')}/$1` },
          { find: /^vue$/, replacement: resolve(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js') },
          { find: /^vue-router$/, replacement: resolve(__dirname, 'node_modules/vue-router/dist/vue-router.esm-bundler.js') },
          { find: /^quasar$/, replacement: resolve(__dirname, 'node_modules/quasar/dist/quasar.client.js') },
          { find: /^quasar\/(.*)$/, replacement: `${resolve(__dirname, 'node_modules/quasar')}/$1` },
          { find: /^axios$/, replacement: resolve(__dirname, 'node_modules/axios/dist/esm/axios.js') },
          { find: /^@capacitor\/preferences$/, replacement: resolve(__dirname, 'node_modules/@capacitor/preferences/dist/esm/index.js') },
          { find: /^@capacitor\/core$/, replacement: resolve(__dirname, 'node_modules/@capacitor/core/dist/index.js') },
          { find: /^@antojados\/http$/, replacement: resolve(httpSharedRoot, 'index.ts') },
          { find: /^@antojados\/http\/(.*)$/, replacement: `${httpSharedRoot}/$1` },
          { find: /^@antojados\/api\/services$/, replacement: resolve(apiSharedRoot, 'services/index.ts') },
          { find: /^@antojados\/api\/services\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'services')}/$1` },
          { find: /^@antojados\/api\/composables\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'composables')}/$1` },
          { find: /^@antojados\/api\/types\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'types')}/$1` },
          { find: /^@antojados\/api\/storage\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'storage')}/$1` },
          { find: /^@antojados\/ui\/base\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'base')}/$1` },
          { find: /^@antojados\/ui\/app\/components\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/components')}/$1` },
          { find: /^@antojados\/ui\/app\/pages\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/pages')}/$1` },
          { find: /^@antojados\/ui\/app\/layouts\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/layouts')}/$1` },
          { find: /^@antojados\/ui\/app\/router\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/router')}/$1` },
          { find: /^@antojados\/ui\/app\/areas\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/areas')}/$1` },
          { find: /^@antojados\/ui\/assets\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'assets')}/$1` },
          { find: /^@antojados\/ui\/mocks\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'mocks')}/$1` },
          { find: /^@antojados\/ui\/dimensions\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'dimensions')}/$1` },
          { find: /^@antojados\/ui\/theme\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'theme')}/$1` },
          { find: /^@antojados\/ui\/services\/base\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'services/base')}/$1` },
          { find: /^@antojados\/ui\/services\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'services')}/$1` }
          , { find: /^@antojados\/ui\/cards\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'cards')}/$1` },
          { find: /^src\/shared\/http$/, replacement: resolve(httpSharedRoot, 'index.ts') },
          { find: /^src\/shared\/http\/(.*)$/, replacement: `${httpSharedRoot}/$1` },
          { find: /^src\/shared\/config\/(.*)$/, replacement: `${resolve(httpSharedRoot, 'config')}/$1` },
          { find: /^src\/shared\/services$/, replacement: resolve(apiSharedRoot, 'services/index.ts') },
          { find: /^src\/shared\/services\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'services')}/$1` },
          { find: /^src\/shared\/composables\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'composables')}/$1` },
          { find: /^src\/shared\/types\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'types')}/$1` },
          { find: /^src\/shared\/storage\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'storage')}/$1` },
          { find: /^src\/composables\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'composables')}/$1` },
          { find: /^src\/types\/(.*)$/, replacement: `${resolve(apiSharedRoot, 'types')}/$1` },
          { find: /^src\/config\/(.*)$/, replacement: `${resolve(httpSharedRoot, 'config')}/$1` },
          { find: /^src\/components\/base\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'base')}/$1` },
          { find: /^src\/components\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/components')}/$1` },
          { find: /^src\/pages\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/pages')}/$1` },
          { find: /^src\/layouts\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/layouts')}/$1` },
          { find: /^src\/router\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/router')}/$1` },
          { find: /^src\/areas\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/areas')}/$1` },
          { find: /^src\/mocks\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'mocks')}/$1` },
          { find: /^layouts\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/layouts')}/$1` },
          { find: /^pages\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/pages')}/$1` },
          { find: /^areas\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/areas')}/$1` },
          { find: /^components\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'app/components')}/$1` },
          { find: /^src\/assets\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'assets')}/$1` },
          { find: /^src\/css\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'css')}/$1` },
          { find: 'src/constants/navigationDimensions', replacement: resolve(uiSharedRoot, 'dimensions/navigationDimensions.js') },
          { find: /^src\/services\/dimensions\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'dimensions')}/$1` }
          , { find: /^src\/services\/theme\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'theme')}/$1` }
          , { find: /^src\/services\/base\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'services/base')}/$1` }
          , { find: /^@antojados\/ui\/services\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'services')}/$1` }
        ]
      }
    },
    devServer: {
      open: false,
      proxy: {
        '/api/media': { target: 'https://api.antojadosmx.mx', changeOrigin: true },
        '/api/v1': { target: 'https://api.antojadosmx.mx', changeOrigin: true },
        '/uploads': { target: 'https://api.antojadosmx.mx', changeOrigin: true },
        '/media': { target: 'https://api.antojadosmx.mx', changeOrigin: true },
      },
    },
    framework: { config: {}, plugins: ['Notify'] },
    animations: [],
    capacitor: { hideSplashscreen: true },
  }
})