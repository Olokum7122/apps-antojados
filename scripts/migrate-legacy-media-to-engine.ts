/**
 * migrate-legacy-media-to-engine.ts
 *
 * Migra datos de media desde tablas legacy (soc_posts, biz_posts, soc_media_assets)
 * al Media Engine V3.
 *
 * Uso:
 *   npx tsx scripts/migrate-legacy-media-to-engine.ts
 *
 * Requisitos:
 *   - Conexion a BD antojados_core
 *   - Conexion a Media Engine V3 (http://localhost:4100)
 *   - Variables de entorno: DB_CONNECTION_STRING, MEDIA_ENGINE_URL
 *
 * Flujo por registro:
 *   1. Descarga el binario desde la URL legacy
 *   2. createMediaRequest() → registerRightsOrigin() → uploadOriginal() → waitForReadyPayload()
 *   3. Actualiza el post con el nuevo mediaId y URLs del engine
 *
 * Lo que NO se migra:
 *   - Posts tester (3 publicaciones)
 *   - Avatares de redes sociales (Google/Gravatar)
 *   - PDFs de expediente (2 archivos de prueba)
 *
 * Lo que SÍ se migra:
 *   - Vas Ir (biz_posts WHERE channel = 'vas_ir')
 *   - Arre (biz_posts WHERE channel = 'arre')
 *   - En el Desma (soc_posts WHERE feed_type = 'desma')
 */

import { createMediaRequest, registerRightsOrigin, uploadOriginal, waitForReadyPayload } from '../shared/api/services/media-engine/mediaEngineClient'

interface MigrationRow {
  id: string
  mediaUrl: string | null
  mediaThumbUrl?: string | null
  mediaFeedUrl?: string | null
  mediaFullUrl?: string | null
  source: 'soc_posts' | 'biz_posts'
  channel?: string | null
}

async function downloadBinary(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} al descargar ${url}`)
  return response.blob()
}

async function migrateRow(row: MigrationRow): Promise<string | null> {
  const url = row.mediaUrl || row.mediaFeedUrl || row.mediaThumbUrl
  if (!url) return null

  console.log(`[migrate] Procesando ${row.source} ${row.id}...`)

  try {
    const blob = await downloadBinary(url)
    const mimeType = blob.type || 'image/jpeg'
    const mediaType = mimeType.startsWith('video') ? 'video' : 'image'
    const ext = mimeType.startsWith('video') ? 'mp4' : 'jpg'

    const request = await createMediaRequest({
      sourceApp: 'ios',
      sourceActorType: 'user',
      sourceActorId: 'migration-script',
      targetContext: row.source === 'biz_posts' ? 'post' : 'post',
      mediaType,
      clientReferenceId: `migrate-${row.source}-${row.id}-${Date.now()}`,
    })

    const mediaId = request.mediaId

    await registerRightsOrigin(mediaId, {
      originType: 'created_in_antojados',
      ownershipType: 'creator_owned',
      rightsStatus: 'declared',
      allowPublicDisplay: true,
      allowDownload: false,
      allowShare: true,
      allowEngineWatermark: true,
      isDemoContent: false,
    })

    await uploadOriginal(mediaId, blob, `migrated-${row.id}.${ext}`)

    const payload = await waitForReadyPayload(mediaId, {
      onStatus: (p, meta) => {
        console.log(`  [${mediaId}] intento ${meta.attempt}/${meta.attempts}: ${p.status}`)
      },
    })

    const engineUrl = payload.payload?.feedUrl || payload.payload?.thumbUrl || ''
    console.log(`  ✅ ${row.id} → mediaId=${mediaId} url=${engineUrl}`)
    return mediaId

  } catch (err) {
    console.error(`  ❌ ${row.id}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    return null
  }
}

async function main() {
  console.log('=== Migracion de media legacy a Media Engine V3 ===')
  console.log('')
  console.log('Este script requiere conexion a BD y al Media Engine.')
  console.log('Ejecutar SOLO cuando el engine esté operativo.')
  console.log('')
  console.log('Migrará: Vas Ir, Arre, En el Desma')
  console.log('No migrará: posts tester, avatares, PDFs de expediente')
  console.log('')

  // Este es un esqueleto ejecutable. Las consultas SQL reales
  // dependen de la conexion a BD que configures.
  //
  // Ejemplo de consultas:
  //
  // -- En el Desma (soc_posts)
  // SELECT post_id, media_url, media_thumbnail_url, media_feed_url, media_full_url
  // FROM antojados_core.soc_posts
  // WHERE feed_type = 'desma' AND media_url IS NOT NULL
  //
  // -- Vas Ir / Arre (biz_posts)
  // SELECT bp.biz_post_id, bp.media_url,
  //        bpm.thumb_url, bpm.feed_url, bpm.full_url, bp.channel
  // FROM antojados_core.biz_posts bp
  // LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
  // WHERE bp.channel IN ('vas_ir', 'arre')
  //   AND (bp.media_url IS NOT NULL OR bpm.media_url IS NOT NULL)

  const rows: MigrationRow[] = [] // ← Aquí se inyectan los resultados de las queries

  if (!rows.length) {
    console.log('No hay registros para migrar.')
    return
  }

  console.log(`Migrando ${rows.length} registros...`)
  let success = 0
  let failed = 0

  for (const row of rows) {
    const result = await migrateRow(row)
    if (result) success++
    else failed++
  }

  console.log('')
  console.log(`=== Migracion completada: ${success} exitosos, ${failed} fallidos ===`)
}

main().catch(console.error)
