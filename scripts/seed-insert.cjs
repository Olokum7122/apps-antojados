N #!/usr/bin/env node
/**
 * seed-insert.cjs
 *
 * Siembra posts demo VAS IR + ARRE usando SOLO el SP usp_publish_biz_post.
 *
 * CUMPLE ESTRICTAMENTE con feed.md §1, §5, §11.2:
 *   - usp_publish_biz_post: SOLO @sponsor_id, @channel, @feed_type, @media_url, @doc_json
 *   - feed_type: SIEMPRE 'publicity' para biz_posts (feed.md §11.2)
 *   - channel: 'vas_ir' o 'arre'
 *   - doc_json: SOLO badge, price, descripciones
 *   - badge válidos: PLATILLO, PROMO, DESCUENTO (vas_ir), EVENTO (arre)
 *
 * PROHIBIDO: INSERT directo, publisher_user_id, title, body, post_type,
 *            venue_name, place_id, titulo, nombre_platillo, texto_promo, GENERAL
 *
 * Uso: node scripts/seed-insert.cjs
 * Requiere: npm install mssql
 */

const sql = require('mssql');

const config = {
  server: '185.187.235.253',
  port: 1433,
  database: 'ATLX_ANTOJADOS_APP',
  user: 'sa',
  password: 'Olokum681228$',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 5000 },
};

const SPONSOR_ID = 'spon_demo_001';
const FEED_TYPE = 'publicity'; // feed.md §11.2: biz_posts siempre publicity

// ── VAS IR - 20 posts ─────────────────────────────────────
// channel: vas_ir | feed_type: publicity
// badge: PLATILLO, PROMO, DESCUENTO (NUNCA GENERAL)
const VAS_IR_POSTS = [
  // PLATILLO — imágenes de platillos/comida
  { b: 'PLATILLO',  d: 'Nuestro nuevo taco de birria estilo Jalisco. Consomé incluido.',                                    p: '$45 c/u', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' },
  { b: 'PLATILLO',  d: 'Molletes con frijoles refritos, queso gratinado y pico de gallo.',                                  p: '$75',    img: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800' },
  { b: 'PLATILLO',  d: 'Aguas frescas naturales de horchata, jamaica y tamarindo.',                                          p: '$35',    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800' },
  { b: 'PLATILLO',  d: 'Ensalada fresca con aderezo de la casa. Opción vegana disponible.',                                  p: '$85',    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800' },
  { b: 'PLATILLO',  d: 'Pizza artesanal horneada en horno de leña. Ingredientes frescos.',                                   p: '$150',   img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800' },
  { b: 'PLATILLO',  d: 'Flan napolitano hecho en casa. Porciones individuales.',                                              p: '$55',    img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800' },
  // PROMO — imágenes de restaurantes/bares con personas
  { b: 'PROMO',     d: 'Dos órdenes de tacos al pastor por el precio de una. Válido toda la semana.',                       p: '$120',  img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800' },
  { b: 'PROMO',     d: 'Burrito gigante con tu refresco favorito por solo $99.',                                             p: '$99',    img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' },
  { b: 'PROMO',     d: 'Ambiente familiar los domingos. Descuento en cuenta para grupos de 4+',                              p: '15% OFF',img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' },
  { b: 'PROMO',     d: 'Todos los martes: tacos a $15 pesos. Válido de 5 a 10 PM.',                                          p: '$15 c/u',img: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800' },
  { b: 'PROMO',     d: 'Hamburguesa artesanal + papas + refresco por $129.',                                                 p: '$129',   img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },
  { b: 'PROMO',     d: 'Lleva 3 tortas por el precio de 2. Todas las variedades.',                                           p: '$220',   img: 'https://images.unsplash.com/photo-1567306301408-9f74779f0af8?w=800' },
  { b: 'PROMO',     d: 'Orden de 4 sopes con tu acompañamiento favorito.',                                                    p: '$80',    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' },
  // DESCUENTO — imágenes de bebidas, cocteles, barras
  { b: 'DESCUENTO', d: '20% off en todas las cervezas artesanales locales. Happy hour extendido.',                          p: '20% OFF',img: 'https://images.unsplash.com/photo-1514519158502-06b8e3a9477d?w=800' },
  { b: 'DESCUENTO', d: 'Todos los cocteles de la carta 2x1 de 6 a 9 PM.',                                                    p: '2x1',    img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800' },
  { b: 'DESCUENTO', d: '30% off en todas las copas de vino después de las 8 PM.',                                            p: '30% OFF',img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800' },
  { b: 'DESCUENTO', d: 'Todos los refrescos 2x1 de 3 a 6 PM.',                                                               p: '2x1',    img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800' },
  // PROMO — generales del bar
  { b: 'PROMO',     d: 'Ahora abrimos hasta las 2 AM los fines de semana. Barra libre hasta media noche.',                  p: '',       img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800' },
  { b: 'PROMO',     d: 'Todos los jueves: noche de karaoke. Gana una cena gratis.',                                          p: '',       img: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800' },
  { b: 'PROMO',     d: 'Inscríbete al torneo de futbolito. Premio: cena para dos.',                                          p: '',       img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800' },
];

// ── ARRE - 10 posts ───────────────────────────────────────
// channel: arre | feed_type: publicity | badge: EVENTO
const ARRE_POSTS = [
  { b: 'EVENTO', d: 'Trío de jazz todos los viernes. Cover $100 consumo mínimo.',             p: '$100', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' },
  { b: 'EVENTO', d: 'DJ invitado desde CDMX. Música electrónica hasta las 3 AM.',             p: '$150', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800' },
  { b: 'EVENTO', d: 'Rock nacional e internacional con bandas locales.',                      p: '$120', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' },
  { b: 'EVENTO', d: 'Clase gratuita de salsa a las 9 PM. Después pista libre.',                p: '$80',  img: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800' },
  { b: 'EVENTO', d: 'Escenario abierto para músicos locales. Inscríbete al llegar.',           p: '$50',  img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800' },
  { b: 'EVENTO', d: 'Stand-up comedy con comediantes locales. Risas aseguradas.',              p: '$100', img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800' },
  { b: 'EVENTO', d: 'Música de los 80s, cocteles de época y dress code retro.',                p: '$180', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800' },
  { b: 'EVENTO', d: 'Taller y presentación de percusión africana y latina.',                   p: '$70',  img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800' },
  { b: 'EVENTO', d: 'Trío de boleros románticos. Cena especial de pareja.',                    p: '$250', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800' },
  { b: 'EVENTO', d: 'DJ invitado especial. Perreo hasta que el cuerpo aguante.',               p: '$130', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800' },
];

function makeDocJson(post) {
  return JSON.stringify({
    badge: post.b,
    price: post.p,
    descripciones: [post.d],
  });
}

async function main() {
  const pool = await sql.connect(config);
  console.log('Connected to ATLX_ANTOJADOS_APP');
  console.log('Usando usp_publish_biz_post con feed.md:');
  console.log('  sponsor_id=spon_demo_001');
  console.log('  feed_type=publicity (feed.md §11.2)');
  console.log('  badges: PLATILLO, PROMO, DESCUENTO, EVENTO');
  console.log('');

  // ── VAS IR - 20 posts ─────────────────────────────────────
  for (let i = 0; i < VAS_IR_POSTS.length; i++) {
    const post = VAS_IR_POSTS[i];
    const docJson = makeDocJson(post);
    try {
      const result = await pool.request()
        .input('sponsor_id', sql.NVarChar(64), SPONSOR_ID)
        .input('channel', sql.NVarChar(30), 'vas_ir')
        .input('feed_type', sql.NVarChar(30), FEED_TYPE)
        .input('media_url', sql.NVarChar(500), post.img)
        .input('doc_json', sql.NVarChar(sql.MAX), docJson)
        .output('biz_post_id', sql.NVarChar(64))
        .execute('antojados_core.usp_publish_biz_post');
      const id = result.output.biz_post_id;
      console.log(`[VAS IR ${i+1}/20] ${post.b}: ${post.d.substring(0, 30)}... ✓ ${id.substring(0, 8)}`);
    } catch (e) {
      console.error(`[VAS IR ${i+1}] ERROR: ${e.message}`);
    }
  }

  // ── ARRE - 10 posts ───────────────────────────────────────
  for (let i = 0; i < ARRE_POSTS.length; i++) {
    const post = ARRE_POSTS[i];
    const docJson = makeDocJson(post);
    try {
      const result = await pool.request()
        .input('sponsor_id', sql.NVarChar(64), SPONSOR_ID)
        .input('channel', sql.NVarChar(30), 'arre')
        .input('feed_type', sql.NVarChar(30), FEED_TYPE)
        .input('media_url', sql.NVarChar(500), post.img)
        .input('doc_json', sql.NVarChar(sql.MAX), docJson)
        .output('biz_post_id', sql.NVarChar(64))
        .execute('antojados_core.usp_publish_biz_post');
      const id = result.output.biz_post_id;
      console.log(`[ARRE ${i+1}/10] ${post.b}: ${post.d.substring(0, 30)}... ✓ ${id.substring(0, 8)}`);
    } catch (e) {
      console.error(`[ARRE ${i+1}] ERROR: ${e.message}`);
    }
  }

  await pool.close();
  console.log('\n✅ SEED COMPLETADO: 20 VAS IR + 10 ARRE');
  console.log('   channel: vas_ir/arre | feed_type: publicity | badges: PLATILLO,PROMO,DESCUENTO,EVENTO');
}

main().catch(console.error);
