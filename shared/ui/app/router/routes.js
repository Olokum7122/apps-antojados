const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/red',
      },
      {
        path: 'antojo',
        component: () => import('pages/AntojoPage.vue'),
        children: [
          { path: '', redirect: '/antojo/vas-ir/gallery' },
          {
            path: 'vas-ir',
            component: () => import('@antojados/ui/app/areas/antojo/components/VasIrPanel.vue'),
            children: [
              { path: '', redirect: 'gallery' },
              { path: 'gallery', component: () => import('@antojados/ui/app/areas/antojo/components/vas-ir/GalleryVasIr.vue') },
              { path: 'catalogo', component: () => import('@antojados/ui/app/areas/antojo/components/vas-ir/CartaVasIr.vue') },
              { path: 'fullscreen', component: () => import('@antojados/ui/app/areas/antojo/components/vas-ir/FullVasIr.vue') },
              { path: 'registro', redirect: '/antojo/mi-chamba/registro' },
              { path: 'e-firma', redirect: '/antojo/mi-chamba/e-firma' },
              { path: 'contrato', redirect: '/antojo/mi-chamba/contrato' },
              { path: 'atencion', redirect: '/antojo/mi-chamba/atencion' },
              { path: 'cuenta', redirect: '/antojo/mi-chamba/cuenta' },
              { path: 'modulos', redirect: '/antojo/mi-chamba/modulos' },
              { path: 'tiles', redirect: '/antojo/mi-chamba/tiles' },
              { path: 'metricas', redirect: '/antojo/mi-chamba/metricas' },
              { path: 'equipo', redirect: '/antojo/mi-chamba/equipo' },
            ],
          },
          {
            path: 'arre',
            component: () => import('@antojados/ui/app/areas/antojo/components/ArrePanel.vue'),
            children: [
              { path: '', redirect: 'agenda' },
              { path: 'agenda', component: () => import('@antojados/ui/app/areas/antojo/components/arre/AgendaArreView.vue') },
              {
                path: 'negocio/:publisher_id',
                component: () => import('@antojados/ui/app/areas/antojo/components/arre/ArreNegocioMockView.vue'),
              },
              {
                path: 'negocio/:publisher_id/post/:post_id',
                component: () => import('@antojados/ui/app/areas/antojo/components/arre/ArrePostFullscreenView.vue'),
              },
              {
                path: 'publicar',
                component: () => import('@antojados/ui/app/areas/antojo/components/arre/PublicarArreView.vue'),
              },
              { path: 'detalle/:id', component: () => import('@antojados/ui/app/areas/antojo/components/arre/DetalleArreView.vue') },
              {
                path: 'fullscreen/:id',
                component: () => import('@antojados/ui/app/areas/antojo/components/arre/FullscreenArreView.vue'),
              },
            ],
          },
          { path: 'los-chidos', component: () => import('@antojados/ui/app/areas/antojo/components/LosChidosPanel.vue') },
          { path: 'no-vas-ir', component: () => import('@antojados/ui/app/areas/antojo/components/NoVasIrPanel.vue') },
          {
            path: 'mi-chamba',
            component: () => import('@antojados/ui/app/areas/antojo/components/MiChambaPanel.vue'),
            children: [
              { path: '', redirect: 'registro' },
              { path: 'registro', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/RegistroView.vue') },
              { path: 'e-firma', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/EfirmaView.vue') },
              { path: 'contrato', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/ContratoView.vue') },
              { path: 'atencion', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/AtencionView.vue') },
              { path: 'cuenta', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/CuentaView.vue') },
              { path: 'modulos', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/ModulosView.vue') },
              { path: 'tiles', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/TilesView.vue') },
              { path: 'metricas', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/MetricasView.vue') },
              { path: 'equipo', component: () => import('@antojados/ui/app/areas/antojo/components/mi-chamba/EquipoView.vue') },
            ],
          },
          { path: 'feed', redirect: '/antojo/vas-ir/gallery' },
          { path: 'publicar', component: () => import('@antojados/ui/app/areas/antojo/components/vas-ir/PublicarVasIrView.vue') },
          { path: 'registro', redirect: '/antojo/mi-chamba/registro' },
          { path: 'e-firma', redirect: '/antojo/mi-chamba/e-firma' },
          { path: 'contrato', redirect: '/antojo/mi-chamba/contrato' },
          { path: 'atencion', redirect: '/antojo/mi-chamba/atencion' },
          { path: 'cuenta', redirect: '/antojo/mi-chamba/cuenta' },
          { path: 'modulos', redirect: '/antojo/mi-chamba/modulos' },
          { path: 'tiles', redirect: '/antojo/mi-chamba/tiles' },
          { path: 'metricas', redirect: '/antojo/mi-chamba/metricas' },
          { path: 'equipo', redirect: '/antojo/mi-chamba/equipo' },
          { path: 'top', redirect: '/antojo/los-chidos' },
          { path: 'zonad', redirect: '/antojo/no-vas-ir' },
          { path: 'mi-negocio', redirect: '/antojo/mi-chamba' },
          { path: 'mi-negocio/registro', redirect: '/antojo/mi-chamba/registro' },
          { path: 'mi-negocio/e-firma', redirect: '/antojo/mi-chamba/e-firma' },
          { path: 'mi-negocio/contrato', redirect: '/antojo/mi-chamba/contrato' },
          { path: 'mi-negocio/atencion', redirect: '/antojo/mi-chamba/atencion' },
          { path: 'mi-negocio/cuenta', redirect: '/antojo/mi-chamba/cuenta' },
          { path: 'mi-negocio/modulos', redirect: '/antojo/mi-chamba/modulos' },
          { path: 'mi-negocio/tiles', redirect: '/antojo/mi-chamba/tiles' },
          { path: 'mi-negocio/metricas', redirect: '/antojo/mi-chamba/metricas' },
          { path: 'mi-negocio/equipo', redirect: '/antojo/mi-chamba/equipo' },
        ],
      },
      {
        path: 'red',
        component: () => import('pages/RedPage.vue'),
        children: [
          { path: '', redirect: '/red/barrio' },
          { path: 'barrio', component: () => import('@antojados/ui/app/areas/antojados/components/BarrioPanel.vue') },
          {
            path: 'barrio/fullscreen/:post_id',
            component: () => import('@antojados/ui/app/areas/antojados/components/barrio/BarrioFullscreenView.vue'),
          },
          {
            path: 'barrio/publicar',
            component: () => import('@antojados/ui/app/areas/antojados/components/barrio/PublicarBarrioView.vue'),
          },
          {
            path: 'pa-ti',
            component: () => import('@antojados/ui/app/areas/antojados/components/PaTiPanel.vue'),
            children: [
              { path: '', redirect: 'pachanga' },
              {
                path: 'pachanga',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/PachangaView.vue'),
              },
              {
                path: 'pachanga/fullscreen/:post_id',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/PachangaFullscreenView.vue'),
              },
              {
                path: 'pachanga/publicar',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/PublicarPachangaView.vue'),
              },
              {
                path: 'pachanga/publicar-resena',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/PublicarResenaView.vue'),
              },
              {
                path: 'que-pex',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/QuePexView.vue'),
              },
              {
                path: 'que-pex/usuario/:user_id',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/QuePexUsuarioView.vue'),
              },
              {
                path: 'que-pex/post/:post_id',
                component: () => import('@antojados/ui/app/areas/antojados/components/pa-ti/QuePexPostFullscreenView.vue'),
              },
              // Legacy redirect — La Neta ahora es Que Pex
              {
                path: 'la-neta',
                redirect: '/red/pa-ti/que-pex',
              },
              {
                path: 'la-neta/usuario/:user_id',
                redirect: (to) => `/red/pa-ti/que-pex/usuario/${to.params.user_id}${to.query.post_id ? `?post_id=${to.query.post_id}` : ''}`,
              },
              {
                path: 'la-neta/post/:post_id',
                redirect: (to) => `/red/pa-ti/que-pex/post/${to.params.post_id}${to.query.user_id ? `?user_id=${to.query.user_id}` : ''}`,
              },
              {
                path: 'la-neta/publicar',
                redirect: '/red/pa-ti/pachanga',
              },
            ],
          },
          { path: 'en-el-desma', component: () => import('@antojados/ui/app/areas/antojados/components/EnElDesmaPanel.vue') },
          {
            path: 'que-pex',
            redirect: '/red/pa-ti/que-pex',
          },
          {
            path: 'la-banda',
            component: () => import('@antojados/ui/app/areas/antojados/components/LaBandaPanel.vue'),
            children: [
              { path: '', redirect: 'acarreados' },
              { path: 'tu-banda', redirect: 'acarreados' },
              {
                path: 'acarreados',
                component: () => import('@antojados/ui/app/areas/antojados/components/la-banda/AcarreadosView.vue'),
              },
            ],
          },
          { path: 'mi-rollo', component: () => import('@antojados/ui/app/areas/antojados/components/MiRolloPanel.vue') },
        ],
      },
      { path: 'yo', component: () => import('pages/YoPage.vue') },
      {
        path: 'negocio/:publisher_id',
        component: () => import('@antojados/ui/app/areas/antojo/components/negocio/NegocioMockView.vue'),
      },
      {
        path: 'negocio/:publisher_id/post/:post_id',
        component: () => import('@antojados/ui/app/areas/antojo/components/negocio/NegocioPostFullscreenView.vue'),
      },
      { path: 'diagnostico', component: () => import('pages/IndexPage.vue') }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'catchAll',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
