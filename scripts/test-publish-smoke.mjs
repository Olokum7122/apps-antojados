#!/usr/bin/env node
/**
 * test-publish-smoke.mjs
 *
 * Smoke test: 5 posts sponsor (VAS IR + ARRE) vía Media Engine.
 * Simula el flujo que hará el FAB Publicar desde el frontend.
 *
 * Uso: node scripts/test-publish-smoke.mjs
 */

const GATEWAY = process.env.GATEWAY_URL || 'http://185.187.235.253:8010';
const SPONSOR_ID = 'spon_demo_001';

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
    postType: 'new_dish',
    imageCount: 3,
    post: {
      title: 'Nuevo: Taco de Birria',
      body: 'Nuestro nuevo taco de birria estilo Jalisco.',
      doc_json: { badge: 'PLATILLO', price: '$99', titulo: 'Nuevo: Taco de Birria', descripciones: ['Nuevo taco de birria estilo Jalisco. Consomé incluido.'] },
    },
  },
  {
    label: 'VAS IR - PROMO (2 imágenes)',
    channel: 'vas_ir',
    postType: 'promo',
    imageCount: 2,
    post: {
      title: 'Combo Hamburguesa',
      body: 'Hamburguesa artesanal + papas + refresco por $129.',
      doc_json: { badge: 'PROMO', price: '$129', titulo: 'Combo Hamburguesa', descripciones: ['Hamburguesa artesanal + papas + refresco por $129.'] },
    },
  },
  {
    label: 'VAS IR - DESCUENTO (1 imagen)',
    channel: 'vas_ir',
    postType: 'discount',
    imageCount: 1,
    post: {
      title: '2x1 en Cocteles',
      body: 'Todos los cocteles de la carta 2x1 de 6 a 9 PM.',
      doc_json: { badge: 'DESCUENTO', price: '2x1', titulo: '2x1 en Cocteles', descripciones: ['Todos los cocteles de la carta 2x1 de 6 a 9 PM.'] },
    },
  },
  {
    label: 'ARRE - EVENTO (3 imágenes)',
    channel: 'arre',
    postType: 'event',
    imageCount: 3,
    post: {
      title: 'Noche de Karaoke',
      body: 'Todos los jueves: noche de karaoke.',
      doc_json: { badge: 'EVENTO', price: '$150', titulo: 'Noche de Karaoke', descripciones: ['Todos los jueves: noche de karaoke. Gana una cena gratis.'] },
    },
  },
  {
    label: 'ARRE - EVENTO (1 imagen)',
    channel: 'arre',
    postType: 'event',
    imageCount: 1,
    post: {
      title: 'DJ Set en Vivo',
      body: 'DJ invitado desde la CDMX. Música electrónica.',
      doc_json: { badge: 'EVENTO', price: '', titulo: 'DJ Set en Vivo', descripciones: ['DJ invitado desde la CDMX. Música electrónica.'] },
    },
  },
];

let passed = 0;
let failed = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(method, path, body = null, isForm = false) {
  const url = `${GATEWAY}${path}`;
  const opts = { method, headers: {} };
  if (body && !isForm) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  else if (body && isForm) { opts.body = body; }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function processImage(sourceUrl, clientRef) {
  const request = await api('POST', '/api/media/requests', {
    sourceApp: 'admin', sourceActorType: 'system', sourceActorId: 'smoke-test',
    targetContext: 'post', mediaType: 'image', clientReferenceId: clientRef,
  });
  const mediaId = request.mediaId;
  await api('POST', `/api/media/${mediaId}/rights-origin`, {
    originType: 'official_antojados', originPlatform: 'antojados', originUrl: sourceUrl,
    rightsStatus: 'approved', rightsDeclaration: 'platform_demo_reference',
    ownershipType: 'company_owned', licenseScope: 'all_media',
    isDemoContent: true, allowPublicDisplay: true, allowShare: true,
  });
  const imgRes = await fetch(sourceUrl);
  const imgBlob = await imgRes.blob();
  const form = new FormData();
  form.append('file', imgBlob, `${clientRef}.jpg`);
  const uploadRes = await fetch(`${GATEWAY}/api/media/${mediaId}/original`, { method: 'POST', body: form });
  if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(`Upload failed: ${JSON.stringify(err)}`); }
  let payload = null;
  for (let a = 1; a <= 6; a++) {
    await sleep(2500);
    try { const r = await api('GET', `/api/media/${mediaId}/ready-payload`); if (r?.ready) { payload = r; break; } } catch {}
  }
  if (!payload?.ready) throw new Error(`Engine timeout for ${mediaId}`);
  return { mediaId, thumbUrl: payload.payload.thumbUrl, feedUrl: payload.payload.feedUrl, fullUrl: payload.payload.fullUrl };
}

async function createPost(channel, postType, post, mediaResults) {
  // El SP usp_publish_biz_post recibe: sponsor_id, channel, feed_type, media_url, doc_json
  // NO recibe media_intake_id. El Gateway resuelve el intake_id internamente.
  const body = {
    title: post.title,
    body: post.body || post.title,
    channel,
    post_type: postType,
    publication_type: postType,
    publisher_user_id: SPONSOR_ID,
    sponsor_user_id: SPONSOR_ID,
    media_url: mediaResults[0].feedUrl,
    doc_json: JSON.stringify(post.doc_json),
  };
  const result = await api('POST', '/api/v1/antojados/biz/posts', body);
  const bizPostId = result.biz_post_id;

  // Adjuntar media secundario si existe
  if (mediaResults.length > 1) {
    for (let i = 1; i < mediaResults.length; i++) {
      const m = mediaResults[i];
      await api('POST', `/api/v1/antojados/biz/posts/${bizPostId}/media`, {
        media_id: m.mediaId,
        media_type: 'photo',
        media_url: m.feedUrl,
        sort_order: i,
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
  console.log('  SMOKE TEST: Publicación Sponsor vía Media Engine');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Gateway: ${GATEWAY}`);
  console.log(`  Sponsor: ${SPONSOR_ID}`);
  console.log(`  Posts a crear: ${TEST_POSTS.length}`);
  console.log('═══════════════════════════════════════════════════════════════');

  let imgIndex = 0;

  for (const test of TEST_POSTS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  ▶ ${test.label}`);
    console.log(`  Channel: ${test.channel} | Type: ${test.postType} | Imágenes: ${test.imageCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const mediaResults = [];
      for (let i = 0; i < test.imageCount; i++) {
        const sourceUrl = IMAGES[imgIndex % IMAGES.length];
        imgIndex++;
        const clientRef = `smoke-${Date.now()}-${i}`;
        process.stdout.write(`  [${i + 1}/${test.imageCount}] Subiendo imagen... `);
        const result = await processImage(sourceUrl, clientRef);
        console.log(`✓ ${result.mediaId.substring(0, 8)}`);
        mediaResults.push(result);
      }
      process.stdout.write('  📝 Creando post... ');
      const bizPostId = await createPost(test.channel, test.postType, test.post, mediaResults);
      console.log(`✓ ${bizPostId}`);
      process.stdout.write('  🔍 Verificando en feed... ');
      await sleep(2000);
      const feed = await api('GET', `/api/v1/antojados/feed?feed_scope=${test.channel}&limit=10`);
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
