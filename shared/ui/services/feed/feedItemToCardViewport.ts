/**
 * feedItemToCardViewport.ts
 * Transforma un FeedItem (del feed gateway, feed.md §11.6)
 * en el formato que espera el Web Component <card-viewport>.
 *
 * Mapeo: FeedItem → { id, docJson, media[], sponsorId, comments }
 */

import type { FeedItem } from '@antojados/api/types/feed'

interface CardViewportPost {
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
  const titulo = post.title || post.caption || ''
  const nombre_platillo = post.title || ''
  const badge = post.postTypeLabel || 'PROMO'
  const descripciones: string[] = []
  if (post.caption) descripciones.push(post.caption)
  const texto_promo = post.title || ''

  const mediaUrls: string[] = []
  if (Array.isArray(post.mediaGallery) && post.mediaGallery.length > 0) {
    post.mediaGallery.forEach((url) => {
      if (url) mediaUrls.push(url)
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
    sponsorId: post.publisherUserId || '',
    comments,
  }
}

export function feedItemListToCardViewport(posts: FeedItem[]): CardViewportPost[] {
  return posts.map(feedItemToCardViewport)
}
