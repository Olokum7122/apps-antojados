#!/usr/bin/env node
/**
 * test-publish-smoke.mjs
 *
 * Smoke test: 5 posts sponsor (VAS IR + ARRE) vía Media Engine.
 *
 * CUMPLE ESTRICTAMENTE con feed.md:
 *   - biz_posts: SOLO columnas de Sección 1
 *   - usp_publish_biz_post: SOLO @sponsor_id, @channel, @feed_type, @media_url, @doc_json
 *   - sp_biz_post_media_attach: SOLO @post_id, @sponsor_id, @media_type, @media_url,
 *                                @sort_order, @asset_id, @thumb_url, @feed_url, @full_url
 *   - doc_json: SOLO badge, price, descripciones (NO titulo, no nombre_platillo, etc.)
 *   - feed_type: SIEMPRE 'publicity' para biz_posts (feed.md §11.2)
 *
 * PROHIBIDO: title, body, post_type, publication_type, publisher_user_id,
 *            sponsor_user_id, place_id, venue_name, media_intake_id
 *
 * Uso: node scripts/test-publish-smoke.mjs
 *   GATEWAY_URL=https://api.antojadosmx.mx (default)
 */

const API_ENDPOINTS = {
  bizPosts: {
    create: '/api/v1/antojados/biz/posts',
    feed: '/api/v1/antojados/feed',
    detail: (id) => `/api/v1/antojados/biz/posts/${encodeURIComponent(id)}`,
    media: (id) => `/api/v1/antojados/biz/posts/${encodeURIComponent(id)}/media`,
  },
  media: {
    requests: '/api/media/requests',
    rightsOrigin: (id) => `/api/media/${encodeURIComponent(id)}/rights-origin`,
    original: (id) => `/api/media/${encodeURIComponent(id)}/original`,
    readyPayload: (id) => `/api/media/${encodeURIComponent(id)}/ready-payload`,
  },
};

const GATEWAY = process.env.GATEWAY_URL || 'https://api.antojadosmx.mx';
const ENGINE_URL = GATEWAY; // Engine va por proxy Nginx del Gateway
const SPONSOR_ID = 'spon_demo_001';
const FEED_TYPE = 'publicity'; // feed.md §11.2

const IMAGES = [
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
  'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
  'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
];

const TEST_POSTS = [
  {
    label: 'VAS IR - PLATILLO (3 imágenes)',
    channel: 'vas_ir',
    imageCount: 3,
    doc_json: { badge: 'PLATILLO', price: '$99', descripciones: ['Nuevo taco de birria estilo Jalisco. Consomé incluido.'] },
  },
  {
    label: 'VAS IR - PROMO (2 imágenes)',
    channel: 'vas_ir',
    imageCount: 2,
    doc_json: { badge: 'PROMO', price: '$129', descripciones: ['Hamburguesa artesanal + papas + refresco por $129.'] },
  },
  {
    label: 'VAS IR - DESCUENTO (1 imagen)',
    channel: 'vas_ir',
    imageCount: 1,
    doc_json: { badge: 'DESCUENTO', price: '2x1', descripciones: ['Todos los cocteles de la carta 2x1 de 6 a 9 PM.'] },
  },
  {
    label: 'ARRE - EVENTO (3 imágenes)',
    channel: 'arre',
    imageCount: 3,
    doc_json: { badge: 'EVENTO', price: '$150', descripciones: ['Todos los jueves: noche de karaoke. Gana una cena gratis.'] },
  },
  {
    label: 'ARRE - EVENTO (1 imagen)',
    channel: 'arre',
    imageCount: 1,
    doc_json: { badge: 'EVENTO', price: '', descripciones: ['DJ invitado desde la CDMX. Música electrónica.'] },
  },
];

let passed = 0;
let failed = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(method, path, body = null, opts = {}) {
  const baseUrl = opts.useEngine ? ENGINE_URL : GATEWAY;
  const url = `${baseUrl}${path}`;
  const fetchOpts = { method, headers: {} };
  if (body && !opts.isForm) { fetchOpts.headers['Content-Type'] = 'application/json'; fetchOpts.body = JSON.stringify(body); }
  else if (body && opts.isForm) { fetchOpts.body = body; }
  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function processImage(sourceUrl, clientRef) {
  const request = await api('POST', API_ENDPOINTS.media.requests, {
    sourceApp: 'admin',
    sourceActorType: 'system',
    sourceActorId: 'smoke-test',
    targetContext: 'post',
    mediaType: 'image',
    clientReferenceId: clientRef,
  }, { useEngine: true });
  const mediaId = request.mediaId;

  await api('POST', API_ENDPOINTS.media.rightsOrigin(mediaId), {
    originType: 'official_antojados',
    originPlatform: 'antojados',
    originUrl: sourceUrl,
    rightsStatus: 'approved',
    rightsDeclaration: 'platform_demo_reference',
    ownershipType: 'company_owned',
    licenseScope: 'all_media',
    isDemoContent: true,
    allowPublicDisplay: true,
    allowShare: true,
  }, { useEngine: true });

  const imgRes = await fetch(sourceUrl);
  const imgBlob = await imgRes.blob();
  const form = new FormData();
  form.append('file', imgBlob, `${clientRef}.jpg`);
  const uploadRes = await fetch(`${ENGINE_URL}${API_ENDPOINTS.media.original(mediaId)}`, { method: 'POST', body: form });
  if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(`Upload failed: ${JSON.stringify(err)}`); }

  let payload = null;
  for (let a = 1; a <= 6; a++) {
    await sleep(2500);
    try {
      const r = await api('GET', API_ENDPOINTS.media.readyPayload(mediaId), null, { useEngine: true });
      if (r?.ready) { payload = r; break; }
    } catch {}
  }
  if (!payload?.ready) throw new Error(`Engine timeout for ${mediaId}`);

  return {
    mediaId,
    thumbUrl: payload.payload.thumbUrl,
    feedUrl: payload.payload.feedUrl,
    fullUrl: payload.payload.fullUrl,
  };
}

async function createPost(channel, docJson, mediaResults) {
  const body = {
    sponsor_id: SPONSOR_ID,
    channel,
    feed_type: FEED_TYPE,
    media_url: mediaResults[0].feedUrl,
    doc_json: JSON.stringify(docJson),
  };
  const result = await api('POST', API_ENDPOINTS.bizPosts.create, body);
  const bizPostId = result.biz_post_id;

  if (mediaResults.length > 1) {
    for (let i = 1; i < mediaResults.length; i++) {
      const m = mediaResults[i];
      await api('POST', API_ENDPOINTS.bizPosts.media(bizPostId), {
        sponsor_id: SPONSOR_ID,
        media_type: 'photo',
        media_url: m.feedUrl,
        sort_order: i,
        asset_id: m.mediaId,
        thumb_url: m.thumbUrl,
        feed_url: m.feedUrl,
        full_url: m.fullUrl,
      });
    }
  }

  return bizPostId;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SMOKE TEST — Pipeline Media Engine + Gateway + Feed');
  console.log('  feed_type=publicity (feed.md §11.2)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Gateway: ${GATEWAY}`);
  console.log(`  Engine:  ${ENGINE_URL}`);
  console.log(`  Sponsor: ${SPONSOR_ID}`);
  console.log(`  Posts:   ${TEST_POSTS.length}`);
  console.log('═══════════════════════════════════════════════════════════════');

  let imgIndex = 0;

  for (const test of TEST_POSTS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  ▶ ${test.label}`);
    console.log(`  Channel: ${test.channel} | Imágenes: ${test.imageCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const mediaResults = [];
      for (let i = 0; i < test.imageCount; i++) {
        const sourceUrl = IMAGES[imgIndex % IMAGES.length];
        imgIndex++;
        const clientRef = `smoke-${Date.now()}-${i}`;
        process.stdout.write(`  [${i + 1}/${test.imageCount}] Subiendo imagen... `);
        const result = await processImage(sourceUrl, clientRef);
        console.log(`✓ ${result.mediaId.substring(0, 8)}...`);
        mediaResults.push(result);
      }

      process.stdout.write('  📝 Creando post (5 campos)... ');
      const bizPostId = await createPost(test.channel, test.doc_json, mediaResults);
      console.log(`✓ ${bizPostId}`);

      process.stdout.write('  🔍 Verificando en feed... ');
      await sleep(2000);
      const feed = await api('GET', `${API_ENDPOINTS.bizPosts.feed}?feed_scope=${test.channel}&limit=10`);
      const found = feed.data?.find(p => p.id === bizPostId);
      if (found) {
        console.log('✓ ENCONTRADO');
        passed++;
      } else {
        console.log('⚠️  No en feed');
        failed++;
      }
    } catch (err) {
      console.error(`❌ ${err.message}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  Total: ${TEST_POSTS.length} | ✅ ${passed} | ❌ ${failed}`);
  console.log('═══════════════════════════════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(`\n❌ FATAL: ${err.message}`); process.exit(1); });
