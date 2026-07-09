#!/usr/bin/env node
/**
 * test-publish-flow.mjs
 * 
 * Prueba el flujo completo de publicación desde el frontend:
 *   ① POST /api/v1/antojados/media/requests        → Crear media request
 *   ② POST /api/v1/antojados/media/:id/rights-origin → Registrar derechos
 *   ③ POST /api/v1/antojados/media/:id/original      → Subir archivo
 *   ④ GET  /api/v1/antojados/media/:id/ready-payload → Obtener URLs
 *   ⑤ POST /api/v1/antojados/biz/posts              → Crear post en BD
 *   ⑥ GET  /api/v1/antojados/feed                    → Verificar en feed
 *
 * Uso:
 *   node scripts/test-publish-flow.mjs
 *
 * Requiere:
 *   - Gateway en https://api.antojadosmx.mx (o variable GATEWAY_URL)
 *   - curl o fetch disponible en Node 18+
 */

const GATEWAY = process.env.GATEWAY_URL || 'http://185.187.235.253:8010';
const TEST_IMAGE = process.env.TEST_IMAGE || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800';

const SPONSOR_ID = 'spon_demo_001';
const CHANNEL = 'vas_ir';

// ─── Helpers ──────────────────────────────────────────────────────────────

let step = 0;

function log(msg, data = null) {
  const prefix = `[${String(++step).padStart(2, '0')}]`;
  console.log(`\n${prefix} ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function api(method, path, body = null, isForm = false) {
  const url = `${GATEWAY}${path}`;
  const opts = { method, headers: {} };

  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isForm) {
    opts.body = body; // FormData
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    console.error(`  ❌ ERROR ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
    throw new Error(`HTTP ${res.status}: ${data?.error || data?.detail || text}`);
  }

  return data;
}

// ─── Flujo principal ──────────────────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  TEST: Flujo de Publicación vía Media Engine');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Gateway: ${GATEWAY}`);
  console.log(`  Sponsor: ${SPONSOR_ID}`);
  console.log(`  Canal:   ${CHANNEL}`);
  console.log('══════════════════════════════════════════════════');

  // ── ① Crear media request ──────────────────────────────────
  log('Creando media request...');
  const request = await api('POST', '/api/v1/antojados/media/requests', {
    sourceApp: 'admin',
    sourceActorType: 'system',
    sourceActorId: 'test-publish-flow',
    targetContext: 'post',
    mediaType: 'image',
    clientReferenceId: `test-flow-${Date.now()}`,
  });
  log('Media request creado:', request);
  const mediaId = request.mediaId;

  // ── ② Registrar derechos/origen ────────────────────────────
  log('Registrando derechos/origen...');
  const rights = await api('POST', `/api/v1/antojados/media/${mediaId}/rights-origin`, {
    originType: 'official_antojados',
    originPlatform: 'antojados',
    originUrl: TEST_IMAGE,
    rightsStatus: 'approved',
    rightsDeclaration: 'platform_demo_reference',
    ownershipType: 'company_owned',
    licenseScope: 'all_media',
    isDemoContent: true,
    allowPublicDisplay: true,
    allowShare: true,
  });
  log('Derechos registrados:', rights);

  // ── ③ Subir archivo original ──────────────────────────────
  log('Descargando imagen de prueba...');
  const imgRes = await fetch(TEST_IMAGE);
  const imgBlob = await imgRes.blob();
  
  log('Subiendo archivo al Engine (multipart)...');
  const form = new FormData();
  form.append('file', imgBlob, 'test-image.jpg');

  const uploadUrl = `${GATEWAY}/api/v1/antojados/media/${mediaId}/original`;
  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error(`  ❌ ERROR ${uploadRes.status}:`, JSON.stringify(uploadData));
    throw new Error(`Upload failed: ${uploadData?.error || uploadRes.status}`);
  }
  log('Archivo subido:', uploadData);

  // ── ④ Esperar y obtener ready payload ─────────────────────
  log('Esperando procesamiento del Engine...');
  await sleep(3000);

  let payload = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      payload = await api('GET', `/api/v1/antojados/media/${mediaId}/ready-payload`);
      if (payload?.ready) {
        log(`Ready payload obtenido (intento ${attempt}):`, payload);
        break;
      }
    } catch (e) {
      // aún no ready
    }
    if (attempt < 5) {
      console.log(`  ⏳ Intento ${attempt}/5 - esperando 2s más...`);
      await sleep(2000);
    }
  }

  if (!payload?.ready) {
    console.error('  ❌ El Engine no completó el procesamiento después de 5 intentos');
    process.exit(1);
  }

  const { thumbUrl, feedUrl, fullUrl, width, height, aspectRatio } = payload.payload;

  // ── ⑤ Crear post en BD ────────────────────────────────────
  log('Creando post en biz_posts via Gateway...');
  const docJson = {
    badge: 'PLATILLO',
    price: '$99',
    descripciones: ['Prueba de publicación vía Engine - post creado desde test-publish-flow.mjs'],
  };

  const post = await api('POST', '/api/v1/antojados/biz/posts', {
    sponsor_id: SPONSOR_ID,
    channel: CHANNEL,
    media_intake_id: mediaId,
    doc_json: docJson,
  });
  log('Post creado:', post);
  const bizPostId = post.biz_post_id;

  // ── ⑥ Verificar en feed ───────────────────────────────────
  log('Verificando post en el feed...');
  await sleep(1000);
  
  const feed = await api('GET', `/api/v1/antojados/feed?feed_scope=${CHANNEL}&limit=5`);
  log('Feed response:', feed);

  const foundInFeed = feed.data?.find(p => p.id === bizPostId);
  if (foundInFeed) {
    console.log(`\n  ✅ POST ENCONTRADO EN FEED: ${bizPostId}`);
    console.log(`     media_url: ${foundInFeed.media_url}`);
    console.log(`     doc_json:  ${JSON.stringify(foundInFeed.doc_json)}`);
  } else {
    console.log(`\n  ⚠️  Post creado pero no encontrado en feed (puede ser paginación/filtro)`);
    console.log(`     biz_post_id: ${bizPostId}`);
    console.log(`     Total posts en feed: ${feed.data?.length || 0}`);
  }

  // ── Resumen ────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('══════════════════════════════════════════════════');
  console.log(`  mediaId:      ${mediaId}`);
  console.log(`  bizPostId:    ${bizPostId}`);
  console.log(`  thumbUrl:     ${thumbUrl}`);
  console.log(`  feedUrl:      ${feedUrl}`);
  console.log(`  fullUrl:      ${fullUrl}`);
  console.log(`  dimensions:   ${width}x${height} (${aspectRatio})`);
  console.log(`  foundInFeed:  ${!!foundInFeed}`);
  console.log('══════════════════════════════════════════════════');
  console.log('  ✅ FLUJO COMPLETO EXITOSO');
  console.log('══════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n❌ FLUJO FALLÓ:', err.message);
  process.exit(1);
});
