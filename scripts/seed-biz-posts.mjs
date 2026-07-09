#!/usr/bin/env node

/**
 * seed-biz-posts.mjs
 * 
 * Siembra 20 posts demo para VAS IR y 10 para ARRE.
 * Usa imágenes reales de Unsplash, las procesa por el Media Engine,
 * y crea los posts vía el Gateway (api_antojados).
 * 
 * Uso:
 *   node seed-biz-posts.mjs
 * 
 * Requiere:
 *   - SSH access al servidor (opcional, usa API REST)
 *   - Gateway en http://185.187.235.253:8010
 *   - Media Engine en http://185.187.235.253:4100
 */

const GATEWAY = 'http://185.187.235.253:8010'
const ENGINE = 'http://185.187.235.253:4100'
const SPONSOR_ID = 'spon_demo_001'
const SPONSOR_NAME = 'Tacos El Demo'

// ─── Imágenes Unsplash para VAS IR (comida, promos, restaurantes) ───
const VAS_IR_POSTS = [
  {
    title: '🔥 Promo 2x1 en Tacos de Pastor',
    badge: 'PROMO',
    desc: 'Dos órdenes de tacos al pastor por el precio de una. Válido toda la semana.',
    price: '$120',
    img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
  },
  {
    title: '🌮 Nuevo: Taco de Birria',
    badge: 'PLATILLO',
    desc: 'Nuestro nuevo taco de birria estilo Jalisco. Consomé incluido.',
    price: '$45 c/u',
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  },
  {
    title: '🍺 Descuento en Cerveza Artesanal',
    badge: 'DESCUENTO',
    desc: '20% off en todas las cervezas artesanales locales. Happy hour extendido.',
    price: '20% OFF',
    img: 'https://images.unsplash.com/photo-1514519158502-06b8e3a9477d?w=800',
  },
  {
    title: '📢 Nuevo Horario Nocturno',
    badge: 'GENERAL',
    desc: 'Ahora abrimos hasta las 2 AM los fines de semana. Barra libre hasta media noche.',
    price: '',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  },
  {
    title: '🌯 Promo: Burrito + Refresco',
    badge: 'PROMO',
    desc: 'Burrito gigante con tu refresco favorito por solo $99.',
    price: '$99',
    img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800',
  },
  {
    title: '🫘 Nuevo: Molletes de la Casa',
    badge: 'PLATILLO',
    desc: 'Molletes con frijoles refritos, queso gratinado y pico de gallo.',
    price: '$75',
    img: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800',
  },
  {
    title: '💰 2x1 en Cócteles',
    badge: 'DESCUENTO',
    desc: 'Todos los cócteles de la carta 2x1 de 6 a 9 PM.',
    price: '2x1',
    img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
  },
  {
    title: '🎶 Noches de Karaoke',
    badge: 'GENERAL',
    desc: 'Todos los jueves: noche de karaoke. Gana una cena gratis.',
    price: '',
    img: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800',
  },
  {
    title: '🌮 Promo: Taco Tuesday',
    badge: 'PROMO',
    desc: 'Todos los martes: tacos a $15 pesos. Válido de 5 a 10 PM.',
    price: '$15 c/u',
    img: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
  },
  {
    title: '🧊 Nuevo: Aguas Frescas',
    badge: 'PLATILLO',
    desc: 'Aguas frescas naturales de horchata, jamaica y tamarindo.',
    price: '$35',
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
  },
  {
    title: '🍔 Combo Hamburguesa',
    badge: 'PROMO',
    desc: 'Hamburguesa artesanal + papas + refresco por $129.',
    price: '$129',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  },
  {
    title: '🥗 Nuevo: Ensalada de la Casa',
    badge: 'PLATILLO',
    desc: 'Ensalada fresca con aderezo de la casa. Opción vegana disponible.',
    price: '$85',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  },
  {
    title: '🍷 Descuento en Vinos',
    badge: 'DESCUENTO',
    desc: '30% off en todas las copas de vino después de las 8 PM.',
    price: '30% OFF',
    img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
  },
  {
    title: '🎉 Cena de Fin de Semana',
    badge: 'GENERAL',
    desc: 'Cena especial los sábados con música en vivo. Reserva con anticipación.',
    price: '',
    img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
  },
  {
    title: '🌯 Promo: 3x2 en Tortas',
    badge: 'PROMO',
    desc: 'Lleva 3 tortas por el precio de 2. Todas las variedades.',
    price: '$220',
    img: 'https://images.unsplash.com/photo-1567306301408-9f74779f0af8?w=800',
  },
  {
    title: '🍕 Nuevo: Pizza de la Casa',
    badge: 'PLATILLO',
    desc: 'Pizza artesanal horneada en horno de leña. Ingredientes frescos.',
    price: '$150',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  },
  {
    title: '🥤 2x1 en Refrescos',
    badge: 'DESCUENTO',
    desc: 'Todos los refrescos 2x1 de 3 a 6 PM.',
    price: '2x1',
    img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800',
  },
  {
    title: '🏆 Campeonato de Futbolito',
    badge: 'GENERAL',
    desc: 'Inscríbete al torneo de futbolito. Premio: cena para dos.',
    price: '',
    img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800',
  },
  {
    title: '🌮 Promo: Orden de Sopes',
    badge: 'PROMO',
    desc: 'Orden de 4 sopes con tu acompañamiento favorito.',
    price: '$80',
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  },
  {
    title: '🧁 Nuevo Postre: Flan Napolitano',
    badge: 'PLATILLO',
    desc: 'Flan napolitano hecho en casa. Porciones individuales.',
    price: '$55',
    img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800',
  },
]

// ─── Imágenes Unsplash para ARRE (eventos, música, DJ, noches) ───
const ARRE_POSTS = [
  {
    title: '🎵 Noche de Jazz en Vivo',
    badge: 'EVENTO',
    desc: 'Trío de jazz todos los viernes. Cover $100 consume mínimo.',
    price: '$100',
    img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  },
  {
    title: '🎧 DJ Set: Noche Electrónica',
    badge: 'EVENTO',
    desc: 'DJ invitado desde CDMX. Música electrónica hasta las 3 AM.',
    price: '$150',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  },
  {
    title: '🎸 Banda de Rock en Vivo',
    badge: 'EVENTO',
    desc: 'Rock nacional e internacional con bandas locales.',
    price: '$120',
    img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
  },
  {
    title: '🕺 Noche de Salsa y Bachata',
    badge: 'EVENTO',
    desc: 'Clase gratuita de salsa a las 9 PM. Después pista libre.',
    price: '$80',
    img: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
  },
  {
    title: '🎤 Open Mic: Talento Local',
    badge: 'EVENTO',
    desc: 'Escenario abierto para músicos locales. Inscríbete al llegar.',
    price: '$50',
    img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
  },
  {
    title: '🎪 Noche de Comedia',
    badge: 'EVENTO',
    desc: 'Stand-up comedy con comediantes locales. Risas aseguradas.',
    price: '$100',
    img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
  },
  {
    title: '🍸 Fiesta de los 80s',
    badge: 'EVENTO',
    desc: 'Música de los 80s, cócteles de época y dress code retro.',
    price: '$180',
    img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800',
  },
  {
    title: '🥁 Percusión en Vivo',
    badge: 'EVENTO',
    desc: 'Taller y presentación de percusión africana y latina.',
    price: '$70',
    img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800',
  },
  {
    title: '🎻 Noche de Boleros',
    badge: 'EVENTO',
    desc: 'Trío de boleros románticos. Cena especial de pareja.',
    price: '$250',
    img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
  },
  {
    title: '🔥 Prendiendo: Reguetón & Urbano',
    badge: 'EVENTO',
    desc: 'DJ invitado especial. Perreo hasta que el cuerpo aguante.',
    price: '$130',
    img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800',
  },
]

// ─── Helpers ───

async function fetchJson(url, options = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`[${resp.status}] ${url}: ${text.substring(0, 200)}`)
  }
  return resp.json()
}

async function uploadToEngine(imageUrl, index, channel) {
  // 1. Descargar imagen de Unsplash
  const imgResp = await fetch(imageUrl)
  const buffer = Buffer.from(await imgResp.arrayBuffer())
  const ext = imageUrl.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg'
  const filename = `${channel}_demo_${String(index).padStart(2, '0')}.${ext}`

  // 2. Crear media request
  const { mediaId } = await fetchJson(`${ENGINE}/api/media/requests`, {
    method: 'POST',
    body: JSON.stringify({
      sourceApp: 'seed',
      sourceActorType: 'sponsor',
      sourceActorId: SPONSOR_ID,
      targetContext: 'post',
      mediaType: 'image',
      processingProfileCode: 'portrait_standard',
    }),
  })
  console.log(`  [${channel}] Media request created: ${mediaId}`)

  // 3. Declarar derechos
  await fetchJson(`${ENGINE}/api/media/${mediaId}/rights-origin`, {
    method: 'POST',
    body: JSON.stringify({
      originType: 'demo_content',
      ownershipType: 'company_owned',
      rightsStatus: 'declared',
      isDemoContent: true,
    }),
  })
  console.log(`  Rights declared`)

  // 4. Subir archivo original
  const formData = new FormData()
  const blob = new Blob([buffer], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  formData.append('file', blob, filename)

  const uploadResp = await fetch(`${ENGINE}/api/media/${mediaId}/original`, {
    method: 'POST',
    body: formData,
  })
  if (!uploadResp.ok) {
    const text = await uploadResp.text()
    throw new Error(`Upload failed: ${text}`)
  }
  console.log(`  Original uploaded: ${filename}`)

  // 5. Esperar a que esté ready (polling)
  let attempts = 0
  let payload = null
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 1000))
    const result = await fetchJson(`${ENGINE}/api/media/${mediaId}/ready-payload`)
    if (result.ready) {
      payload = result.payload
      break
    }
    attempts++
  }
  if (!payload) throw new Error(`Media ${mediaId} did not become ready`)

  console.log(`  Media ready: feed=${payload.feedUrl.split('/').pop()}`)

  return {
    mediaId,
    thumbUrl: payload.thumbUrl,
    feedUrl: payload.feedUrl,
    fullUrl: payload.fullUrl,
  }
}

async function createPost(postData, mediaResult, channel) {
  const docJson = {
    badge: postData.badge,
    price: postData.price,
    descripciones: [postData.desc],
    titulo: postData.title,
    nombre_platillo: postData.title,
    texto_promo: postData.title,
  }

  const body = {
    sponsor_id: SPONSOR_ID,
    channel,
    feed_type: channel === 'arre' ? 'event' : 'default',
    media_url: mediaResult.feedUrl,
    doc_json: JSON.stringify(docJson),
    title: postData.title,
    body: postData.desc,
  }

  const result = await fetchJson(`${GATEWAY}/api/v1/antojados/biz/posts`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const bizPostId = result.biz_post_id || result.data?.biz_post_id || result.id
  console.log(`  Post created: ${bizPostId}`)

  // Attach media
  if (bizPostId) {
    await fetchJson(`${GATEWAY}/api/v1/antojados/biz/posts/${bizPostId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        media_id: mediaResult.mediaId,
        media_type: 'photo',
        media_url: mediaResult.feedUrl,
        sort_order: 0,
        thumb_url: mediaResult.thumbUrl,
        feed_url: mediaResult.feedUrl,
        full_url: mediaResult.fullUrl,
      }),
    })
    console.log(`  Media attached`)
  }

  return bizPostId
}

// ─── Main ───

async function main() {
  console.log('=== SEEDING BIZ POSTS ===\n')
  console.log(`Gateway: ${GATEWAY}`)
  console.log(`Engine: ${ENGINE}`)
  console.log(`Sponsor: ${SPONSOR_ID}\n`)

  // Verificar conectividad
  try {
    const health = await fetchJson(`${ENGINE}/health`)
    console.log(`Engine health: ${health.status || 'OK'}\n`)
  } catch (e) {
    console.error(`Cannot reach Media Engine: ${e.message}`)
    process.exit(1)
  }

  try {
    await fetchJson(`${GATEWAY}/api/v1/antojados/biz/posts?limit=1`)
    console.log('Gateway reachable\n')
  } catch (e) {
    console.error(`Cannot reach Gateway: ${e.message}`)
    process.exit(1)
  }

  // VAS IR - 20 posts
  console.log('═══ VAS IR (20 posts) ═══')
  for (let i = 0; i < VAS_IR_POSTS.length; i++) {
    const post = VAS_IR_POSTS[i]
    console.log(`\n[${i + 1}/20] ${post.badge}: ${post.title}`)
    try {
      const media = await uploadToEngine(post.img, i, 'vas_ir')
      await createPost(post, media, 'vas_ir')
    } catch (e) {
      console.error(`  FAILED: ${e.message}`)
    }
  }

  // ARRE - 10 posts
  console.log('\n═══ ARRE (10 posts) ═══')
  for (let i = 0; i < ARRE_POSTS.length; i++) {
    const post = ARRE_POSTS[i]
    console.log(`\n[${i + 1}/10] ${post.badge}: ${post.title}`)
    try {
      const media = await uploadToEngine(post.img, i, 'arre')
      await createPost(post, media, 'arre')
    } catch (e) {
      console.error(`  FAILED: ${e.message}`)
    }
  }

  console.log('\n✅ SEED COMPLETADO')
}

main().catch(console.error)
