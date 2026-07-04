// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

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
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [
      'theme-manager',
      'axios'
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: [
      'app.scss',
      'indexclasses.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22'
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // extendViteConf (viteConf) {},
      // viteVuePluginOptions: {},

      vitePlugins: [
        ['vite-plugin-checker', {
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true
          }
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
          { find: /^@antojados\/ui\/services\/(.*)$/, replacement: `${resolve(uiSharedRoot, 'services')}/$1` },
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

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // https: true,
      open: false,
      proxy: {
        '/api/media': {
          target: 'https://api.antojadosmx.mx',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'https://api.antojadosmx.mx',
          changeOrigin: true,
        },
        '/media': {
          target: 'https://api.antojadosmx.mx',
          changeOrigin: true,
        },
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [
        'Notify'
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
                      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render' // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW' // 'GenerateSW' or 'InjectManifest'
      // swFilename: 'sw.js',
      // manifestFilename: 'manifest.json',
      // extendManifestJson (json) {},
      // useCredentialsForManifestTag: true,
      // injectPwaMetaTags: false,
      // extendPWACustomSWConf (esbuildConf) {},
      // extendGenerateSWOptions (cfg) {},
      // extendInjectManifestOptions (cfg) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: [ 'electron-preload' ],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration

        appId: 'antojadosmx-ios'
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: []
    }
  }
})
