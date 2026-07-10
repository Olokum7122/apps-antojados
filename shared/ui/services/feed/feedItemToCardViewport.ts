/**
 * feedItemToCardViewport.ts
 * Transforma un FeedItem (del feed gateway, feed.md §11.6)
 * en el formato que espera el Web Component <card-viewport>.
 *
 * Mapeo: FeedItem → { id, docJson, media[], sponsorId, comments, channel }
 *
 * Según feed.md §7, doc_json solo contiene: badge, price, descripciones[]
 * El WC espera en docJson: titulo, nombre_platillo, badge, descripciones[], texto_promo
 *
 * FLUJO:
 *   Gateway RawFeedPost.doc_json: { badge, price, descripciones: ["texto1", "texto2"] }
 *     → BizFeedService.mapBizPost() extrae:
 *         - title = descripciones[0] (primer elemento)
 *         - caption = title
 *         - descripciones[] = array crudo del doc_json
 *         - postTypeLabel = badge (mapeado a mayúsculas)
 *     → feedItemToCardViewport() transforma a:
 *         - docJson.titulo = descripciones[0] o caption
 *         - docJson.nombre_platillo = descripciones[0] o caption
 *         - docJson.badge = postTypeLabel
 *         - docJson.descripciones[] = descripciones[] del FeedItem
 *         - docJson.texto_promo = descripciones[0] o caption
 */

import type { FeedItem } from '@antojados/api/types/feed'

export interface CardViewportPost {
  id: string
  docJson: {
    titulo: string
    nombre_platillo: string
    badge: string
    descripciones: string[]
    texto_promo: string
  }
  media: string[]
  sponsorId: string
  comments: Array<{ user: string; text: string }>
}

export function feedItemToCardViewport(post: FeedItem): CardViewportPost {
  // FeedItem.descripciones[] viene directo del doc_json.descripciones[] (feed.md §7)
  // FeedItem.title = descripciones[0] (primer elemento, extraído por extractTitle)
  // FeedItem.postTypeLabel = badge mapeado a mayúsculas (PROMO, PLATILLO, etc.)
  const primerTexto = (Array.isArray(post.descripciones) && post.descripciones.length > 0)
    ? post.descripciones[0]
    : (post.caption || post.title || '')

  const titulo = primerTexto
  const nombre_platillo = primerTexto
  const badge = post.postTypeLabel || 'PROMO'
  const descripciones: string[] = (Array.isArray(post.descripciones) && post.descripciones.length > 0)
    ? [...post.descripciones]
    : (primerTexto ? [primerTexto] : [])
  const texto_promo = primerTexto

  const mediaUrls: string[] = []
  if (Array.isArray(post.mediaGallery) && post.mediaGallery.length > 0) {
    post.mediaGallery.forEach((url) => {
      if (url && typeof url === 'string') mediaUrls.push(url)
    })
  }
  if (mediaUrls.length === 0 && post.mediaUrl) {
    mediaUrls.push(post.mediaUrl)
  }
  if (mediaUrls.length === 0) {
    mediaUrls.push('/shared/default-card-bg.png')
  }

  const comments = Array.isArray(post.comments)
    ? post.comments.map((c) => ({
        user: c.user || 'anon',
        text: c.text || '',
      }))
    : []

  return {
    id: post.id,
    docJson: { titulo, nombre_platillo, badge, descripciones, texto_promo },
    media: mediaUrls,
    sponsorId: post.ownerId || '',
    comments,
  }
}

export function feedItemListToCardViewport(posts: FeedItem[]): CardViewportPost[] {
  return posts.map(feedItemToCardViewport)
}
