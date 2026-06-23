import sponsorRestaurante from '@antojados/ui/assets/mock/sponsor_restaurante.png'
import sponsorAntro from '@antojados/ui/assets/mock/sponsor_antro.png'
import usuarioRedSocial from '@antojados/ui/assets/mock/usuario_red_social.png'
import usuarioPachanga from '@antojados/ui/assets/mock/usuario_pachanga.png'

export const VAS_IR_POST_TYPES = [
  { value: '', label: 'Todos', color: 'grey-7' },
  { value: 'promo', label: 'PROMO', color: 'primary' },
  { value: 'new_dish', label: 'PLATILLO', color: 'green-7' },
  { value: 'discount', label: 'DESCUENTO', color: 'deep-orange-6' },
  { value: 'general', label: 'GENERAL', color: 'grey-7' },
]

export const ARRE_POST_TYPES = [{ value: 'event', label: 'EVENTO', color: 'deep-purple-6' }]

export const arreMockComments = {
  'arre-01': [
    { id: 'arre-01-c1', user: 'luna', text: 'A que hora empieza?' },
    { id: 'arre-01-c2', user: 'memo', text: 'Hay reservacion para mesa?' },
  ],
  'arre-03': [
    { id: 'arre-03-c1', user: 'sofi', text: 'Va a haber cover?' },
  ],
}

export const vasIrMockComments = {
  'vasir-promo-01': [
    { id: 'vasir-promo-01-c1', user: 'mario', text: 'La promo aplica hoy?' },
    { id: 'vasir-promo-01-c2', user: 'ana', text: 'Buen precio para ir con compas.' },
  ],
  'vasir-platillo-01': [
    { id: 'vasir-platillo-01-c1', user: 'luis', text: 'Ese corte si se ve bueno.' },
  ],
}

export const vasIrUiPosts = [
  {
    id: 'vasir-promo-01',
    publisherUserId: 'biz-la-campeona',
    placeId: 'place-la-campeona',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'La Campeona',
    authorHandle: 'lacampenona.mx',
    postType: 'promo',
    postTypeLabel: 'PROMO',
    caption: '3x2 tacos y cerveza nacional',
    likesCount: 42,
    commentsCount: 8,
  },
  {
    id: 'vasir-promo-01-b',
    publisherUserId: 'biz-la-campeona',
    placeId: 'place-la-campeona',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'La Campeona',
    authorHandle: 'lacampenona.mx',
    postType: 'new_dish',
    postTypeLabel: 'PLATILLO',
    caption: 'Orden botanera para mesa completa',
    likesCount: 24,
    commentsCount: 3,
  },
  {
    id: 'vasir-promo-01-c',
    publisherUserId: 'biz-la-campeona',
    placeId: 'place-la-campeona',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'La Campeona',
    authorHandle: 'lacampenona.mx',
    postType: 'general',
    postTypeLabel: 'GENERAL',
    caption: 'Ambiente de lunes a sabado',
    likesCount: 19,
    commentsCount: 5,
  },
  {
    id: 'vasir-promo-02',
    publisherUserId: 'biz-antro-centro',
    placeId: 'place-antro-centro',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Antro Centro',
    authorHandle: 'antrocentro',
    postType: 'discount',
    postTypeLabel: 'DESCUENTO',
    caption: 'Come y bebe por precio fijo',
    likesCount: 29,
    commentsCount: 4,
  },
  {
    id: 'vasir-promo-02-b',
    publisherUserId: 'biz-antro-centro',
    placeId: 'place-antro-centro',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Antro Centro',
    authorHandle: 'antrocentro',
    postType: 'promo',
    postTypeLabel: 'PROMO',
    caption: 'Botella nacional en promo de grupo',
    likesCount: 33,
    commentsCount: 6,
  },
  {
    id: 'vasir-promo-02-c',
    publisherUserId: 'biz-antro-centro',
    placeId: 'place-antro-centro',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Antro Centro',
    authorHandle: 'antrocentro',
    postType: 'general',
    postTypeLabel: 'GENERAL',
    caption: 'Zona lounge disponible esta noche',
    likesCount: 21,
    commentsCount: 2,
  },
  {
    id: 'vasir-platillo-01',
    publisherUserId: 'biz-parrilla-norte',
    placeId: 'place-parrilla-norte',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'Parrilla Norte',
    authorHandle: 'parrillanorte',
    postType: 'new_dish',
    postTypeLabel: 'PLATILLO',
    caption: 'Corte para compartir',
    likesCount: 55,
    commentsCount: 11,
  },
  {
    id: 'vasir-platillo-01-b',
    publisherUserId: 'biz-parrilla-norte',
    placeId: 'place-parrilla-norte',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Parrilla Norte',
    authorHandle: 'parrillanorte',
    postType: 'promo',
    postTypeLabel: 'PROMO',
    caption: 'Parrillada y cerveza para compartir',
    likesCount: 47,
    commentsCount: 8,
  },
  {
    id: 'vasir-platillo-01-c',
    publisherUserId: 'biz-parrilla-norte',
    placeId: 'place-parrilla-norte',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Parrilla Norte',
    authorHandle: 'parrillanorte',
    postType: 'discount',
    postTypeLabel: 'DESCUENTO',
    caption: 'Descuento en corte seleccionado',
    likesCount: 31,
    commentsCount: 4,
  },
  {
    id: 'vasir-general-01',
    publisherUserId: 'biz-puerto-metepec',
    placeId: 'place-puerto-metepec',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Puerto Metepec',
    authorHandle: 'puertometepec',
    postType: 'general',
    postTypeLabel: 'GENERAL',
    caption: 'Disfruta sin limites',
    likesCount: 17,
    commentsCount: 2,
  },
  {
    id: 'vasir-general-01-b',
    publisherUserId: 'biz-puerto-metepec',
    placeId: 'place-puerto-metepec',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Puerto Metepec',
    authorHandle: 'puertometepec',
    postType: 'promo',
    postTypeLabel: 'PROMO',
    caption: 'Come todo lo que puedas por tiempo limitado',
    likesCount: 28,
    commentsCount: 7,
  },
  {
    id: 'vasir-general-01-c',
    publisherUserId: 'biz-puerto-metepec',
    placeId: 'place-puerto-metepec',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'Puerto Metepec',
    authorHandle: 'puertometepec',
    postType: 'new_dish',
    postTypeLabel: 'PLATILLO',
    caption: 'Mariscos para la mesa',
    likesCount: 39,
    commentsCount: 5,
  },
  {
    id: 'vasir-platillo-02',
    publisherUserId: 'biz-la-parrillada',
    placeId: 'place-la-parrillada',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'La Parrillada',
    authorHandle: 'laparrillada',
    postType: 'new_dish',
    postTypeLabel: 'PLATILLO',
    caption: 'Parrillada para tres',
    likesCount: 63,
    commentsCount: 9,
  },
  {
    id: 'vasir-platillo-02-b',
    publisherUserId: 'biz-la-parrillada',
    placeId: 'place-la-parrillada',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'La Parrillada',
    authorHandle: 'laparrillada',
    postType: 'promo',
    postTypeLabel: 'PROMO',
    caption: 'Paquete familiar con guarniciones',
    likesCount: 58,
    commentsCount: 10,
  },
  {
    id: 'vasir-platillo-02-c',
    publisherUserId: 'biz-la-parrillada',
    placeId: 'place-la-parrillada',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'La Parrillada',
    authorHandle: 'laparrillada',
    postType: 'discount',
    postTypeLabel: 'DESCUENTO',
    caption: 'Combo para tres con bebida incluida',
    likesCount: 36,
    commentsCount: 4,
  },
]

export function findVasIrPostById(postId) {
  return vasIrUiPosts.find((post) => isVasIrPost(post) && post.id === postId) || vasIrUiPosts[0]
}

export function findVasIrPostsByPublisher(publisherUserId) {
  const rows = vasIrUiPosts.filter((post) => isVasIrPost(post) && post.publisherUserId === publisherUserId)
  return rows.length ? rows : vasIrUiPosts.filter(isVasIrPost)
}

export function findVasIrPostMedia(postId) {
  const post = findVasIrPostById(postId)
  const groupId = vasIrMediaGroupId(post?.id || '')
  return vasIrUiPosts
    .filter((item) => isVasIrPost(item) && vasIrMediaGroupId(item.id) === groupId)
    .map((item) => item.mediaUrl)
    .filter(Boolean)
}

export function findVasIrComments(postId) {
  return vasIrMockComments[postId] || []
}

function isVasIrPost(post) {
  return post && post.channel !== 'arre' && post.postType !== 'event'
}

function vasIrMediaGroupId(postId) {
  return String(postId).replace(/-[bc]$/, '')
}

export const barrioUiPosts = [
  {
    id: 'barrio-01',
    scope: 'barrio',
    cityMode: 'global',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'Barrio Centro',
    authorHandle: 'olokum68',
    caption: 'La banda ya anda en la calle',
    likesCount: 18,
    commentsCount: 3,
  },
  {
    id: 'barrio-02',
    scope: 'barrio',
    cityMode: 'nearby',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Puesto de la esquina',
    authorHandle: 'carlosmx',
    caption: 'Se armo el cotorreo',
    likesCount: 27,
    commentsCount: 6,
  },
  {
    id: 'barrio-sponsor-01',
    _sponsor: true,
    _key: 'barrio-sponsor-01',
  },
  {
    id: 'barrio-03',
    scope: 'barrio',
    cityMode: 'global',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Comida del barrio',
    authorHandle: 'antojadosmx',
    caption: 'Promo local recomendada',
    likesCount: 34,
    commentsCount: 7,
  },
]

export function findBarrioPostById(postId) {
  return barrioUiPosts.find((post) => post.id === postId && post.scope === 'barrio') || barrioUiPosts[0]
}

export function findBarrioAssociatedPosts(postId) {
  const selected = findBarrioPostById(postId)
  const scoped = barrioUiPosts.filter((post) => post.scope === 'barrio' && !post._sponsor)
  const sameMode = scoped.filter((post) => post.cityMode === selected?.cityMode)
  const rows = sameMode.length > 1 ? sameMode : scoped
  return rows.length ? rows : selected ? [selected] : []
}

export function findBarrioComments(postId) {
  const comments = {
    'barrio-01': [
      { id: 'barrio-comment-01', user: 'ana', text: 'Ese punto siempre se pone bueno.' },
      { id: 'barrio-comment-02', user: 'lalo', text: 'A que hora arranca?' },
    ],
    'barrio-02': [
      { id: 'barrio-comment-03', user: 'mario', text: 'Ya esta llena la esquina.' },
      { id: 'barrio-comment-04', user: 'sofi', text: 'Guarden lugar.' },
    ],
    'barrio-03': [
      { id: 'barrio-comment-05', user: 'ro', text: 'Esa promo si jala.' },
    ],
  }
  return comments[postId] || []
}

export const pachangaUiPosts = [
  {
    id: 'pachanga-01',
    scope: 'pachanga',
    preferenceBucket: 'mejores',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Demo Venue Pachanga',
    authorHandle: 'olokum68',
    caption: 'Pachanga en vivo con la banda',
    likesCount: 64,
    commentsCount: 13,
    comments: [
      { id: 'p-c1', user: 'ana', text: 'Ya llegue' },
      { id: 'p-c2', user: 'luis', text: 'Guarden mesa' },
    ],
  },
  {
    id: 'pachanga-02',
    scope: 'pachanga',
    preferenceBucket: 'cerca',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'La Noche',
    authorHandle: 'monse',
    caption: 'Selfie de la mesa',
    likesCount: 22,
    commentsCount: 5,
  },
  {
    id: 'pachanga-sponsor-01',
    _sponsor: true,
    _key: 'pachanga-sponsor-01',
  },
  {
    id: 'pachanga-03',
    scope: 'pachanga',
    preferenceBucket: 'ciudad',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Bar Mundial',
    authorHandle: 'bar_mundial',
    caption: 'Se prendio el partido',
    likesCount: 48,
    commentsCount: 10,
  },
]

export function findPachangaPostById(postId) {
  return (
    pachangaUiPosts.find((post) => post.id === postId && post.scope === 'pachanga') ||
    pachangaUiPosts.find((post) => !post._sponsor)
  )
}

export function findPachangaAssociatedPosts(postId) {
  const selected = findPachangaPostById(postId)
  const bucket = selected?.preferenceBucket || ''
  const scoped = pachangaUiPosts.filter((post) => post.scope === 'pachanga' && !post._sponsor)
  const sameBucket = scoped.filter((post) => post.preferenceBucket === bucket)
  const rows = sameBucket.length > 1 ? sameBucket : scoped
  return rows.length ? rows : selected ? [selected] : []
}

export function findPachangaComments(postId) {
  return findPachangaPostById(postId)?.comments || []
}

export const laNetaUiPosts = [
  {
    id: 'neta-01',
    userId: 'user-olokum68',
    place_id: 'lacampenona-mx',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    author: 'olokum68',
    authorHandle: 'olokum68',
    venue: 'La Campeona',
    venueName: 'La Campeona',
    dish: 'Tacos',
    momentTag: 'LaNeta',
    caption: 'La neta, buenos tacos para ir con compas.',
    likesCount: 31,
    commentsCount: 6,
    ratingVerdicts: [{ dim: 'taste', phrase: 'Sabor cumplidor y buena promo' }],
  },
  {
    id: 'neta-02',
    userId: 'user-carlosmx',
    place_id: 'parrilla-norte',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    author: 'carlosmx',
    authorHandle: 'carlosmx',
    venue: 'Parrilla Norte',
    venueName: 'Parrilla Norte',
    dish: 'Corte',
    momentTag: 'Resena',
    caption: 'Buen lugar si vas con hambre real.',
    likesCount: 44,
    commentsCount: 12,
    ratingVerdicts: [{ dim: 'price', phrase: 'Precio justo para la porcion' }],
  },
]

export function findLaNetaPostById(postId) {
  return laNetaUiPosts.find((post) => post.id === postId) || laNetaUiPosts[0]
}

export function findLaNetaPostsByUser(userId) {
  const rows = laNetaUiPosts.filter((post) => post.userId === userId)
  return rows.length ? rows : laNetaUiPosts
}

export function findLaNetaComments(postId) {
  const comments = {
    'neta-01': [
      { id: 'neta-comment-01', user: 'ana', text: 'Confirmo, esos tacos si jalan.' },
      { id: 'neta-comment-02', user: 'lalo', text: 'Cuanto sale ir con dos?' },
    ],
    'neta-02': [
      { id: 'neta-comment-03', user: 'monse', text: 'La porcion se ve bien.' },
      { id: 'neta-comment-04', user: 'ro', text: 'Ese corte lo tengo pendiente.' },
    ],
  }
  return comments[postId] || []
}

export const desmaUiPosts = [
  {
    id: 'desma-01',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    authorHandle: 'montse29595',
    venueName: 'En el Desma',
    caption: 'Short demo en modo vertical',
    durationSec: 15,
    likesCount: 82,
    commentsCount: 0,
    comments: [],
  },
  {
    id: 'desma-02',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    authorHandle: 'olokum68',
    venueName: 'Desma Centro',
    caption: 'La banda grabando el momento',
    durationSec: 23,
    likesCount: 39,
    commentsCount: 4,
    comments: [{ id: 'd-c1', user: 'leo', text: 'Eso estuvo bueno' }],
  },
]

export const arreUiPosts = [
  {
    id: 'arre-01',
    channel: 'arre',
    publisherUserId: 'arre-noche-norte',
    placeId: 'place-noche-norte',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Noche Norte',
    authorHandle: 'nochenorte',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Noche tematica con musica en vivo',
    likesCount: 51,
    commentsCount: 7,
  },
  {
    id: 'arre-01-b',
    channel: 'arre',
    publisherUserId: 'arre-noche-norte',
    placeId: 'place-noche-norte',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Noche Norte',
    authorHandle: 'nochenorte',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'DJ invitado y zona lounge',
    likesCount: 43,
    commentsCount: 6,
  },
  {
    id: 'arre-01-c',
    channel: 'arre',
    publisherUserId: 'arre-noche-norte',
    placeId: 'place-noche-norte',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Noche Norte',
    authorHandle: 'nochenorte',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Preventa disponible para la banda',
    likesCount: 38,
    commentsCount: 5,
  },
  {
    id: 'arre-02',
    channel: 'arre',
    publisherUserId: 'arre-fiesta-centro',
    placeId: 'place-fiesta-centro',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Fiesta Centro',
    authorHandle: 'fiestacentro',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Entrada libre antes de las diez',
    likesCount: 36,
    commentsCount: 3,
  },
  {
    id: 'arre-02-b',
    channel: 'arre',
    publisherUserId: 'arre-fiesta-centro',
    placeId: 'place-fiesta-centro',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Fiesta Centro',
    authorHandle: 'fiestacentro',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Noche tematica para llegar con compas',
    likesCount: 44,
    commentsCount: 8,
  },
  {
    id: 'arre-02-c',
    channel: 'arre',
    publisherUserId: 'arre-fiesta-centro',
    placeId: 'place-fiesta-centro',
    mediaUrl: usuarioRedSocial,
    mediaType: 'image',
    venueName: 'Fiesta Centro',
    authorHandle: 'fiestacentro',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Acceso antes de las diez',
    likesCount: 27,
    commentsCount: 4,
  },
  {
    id: 'arre-03',
    channel: 'arre',
    publisherUserId: 'arre-terraza-sur',
    placeId: 'place-terraza-sur',
    mediaUrl: sponsorRestaurante,
    mediaType: 'image',
    venueName: 'Terraza Sur',
    authorHandle: 'terrazasur',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'DJ invitado y promo de grupo',
    likesCount: 64,
    commentsCount: 10,
  },
  {
    id: 'arre-03-b',
    channel: 'arre',
    publisherUserId: 'arre-terraza-sur',
    placeId: 'place-terraza-sur',
    mediaUrl: sponsorAntro,
    mediaType: 'image',
    venueName: 'Terraza Sur',
    authorHandle: 'terrazasur',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Terraza abierta con musica en vivo',
    likesCount: 52,
    commentsCount: 9,
  },
  {
    id: 'arre-03-c',
    channel: 'arre',
    publisherUserId: 'arre-terraza-sur',
    placeId: 'place-terraza-sur',
    mediaUrl: usuarioPachanga,
    mediaType: 'image',
    venueName: 'Terraza Sur',
    authorHandle: 'terrazasur',
    postType: 'event',
    postTypeLabel: 'EVENTO',
    caption: 'Reservaciones abiertas para grupos',
    likesCount: 49,
    commentsCount: 7,
  },
]

export function findArrePostById(postId) {
  return arreUiPosts.find((post) => post.id === postId && post.channel === 'arre') || arreUiPosts[0]
}

export function findArrePostsByPublisher(publisherUserId) {
  const rows = arreUiPosts.filter(
    (post) =>
      post.channel === 'arre' &&
      post.postType === 'event' &&
      post.publisherUserId === publisherUserId,
  )
  return rows.length ? rows : arreUiPosts.filter((post) => post.channel === 'arre')
}

export function findArrePostMedia(postId) {
  const post = findArrePostById(postId)
  const groupId = arreMediaGroupId(post?.id || '')
  return arreUiPosts
    .filter(
      (item) =>
        item.channel === 'arre' &&
        item.postType === 'event' &&
        arreMediaGroupId(item.id) === groupId,
    )
    .map((item) => item.mediaUrl)
    .filter(Boolean)
}

export function findArreComments(postId) {
  return arreMockComments[postId] || []
}

function arreMediaGroupId(postId) {
  return String(postId).replace(/-[bc]$/, '')
}
