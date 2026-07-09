#!/usr/bin/env node

const sql = require('/opt/api_antojados/node_modules/mssql');
const crypto = require('crypto');

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
const PLACE_ID = 'place_demo_001';
const VENUE_NAME = 'Demo Bar & Grill';

const VAS_IR_POSTS = [
  { t: 'Promo 2x1 en Tacos de Pastor', b: 'PROMO', d: 'Dos órdenes de tacos al pastor por el precio de una. Valido toda la semana.', p: '$120', img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800', pt: 'promo' },
  { t: 'Nuevo: Taco de Birria', b: 'PLATILLO', d: 'Nuestro nuevo taco de birria estilo Jalisco. Consome incluido.', p: '$45 c/u', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', pt: 'new_dish' },
  { t: 'Descuento en Cerveza Artesanal', b: 'DESCUENTO', d: '20% off en todas las cervezas artesanales locales. Happy hour extendido.', p: '20% OFF', img: 'https://images.unsplash.com/photo-1514519158502-06b8e3a9477d?w=800', pt: 'discount' },
  { t: 'Nuevo Horario Nocturno', b: 'GENERAL', d: 'Ahora abrimos hasta las 2 AM los fines de semana. Barra libre hasta media noche.', p: '', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', pt: 'general' },
  { t: 'Promo: Burrito + Refresco', b: 'PROMO', d: 'Burrito gigante con tu refresco favorito por solo $99.', p: '$99', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800', pt: 'promo' },
  { t: 'Nuevo: Molletes de la Casa', b: 'PLATILLO', d: 'Molletes con frijoles refritos, queso gratinado y pico de gallo.', p: '$75', img: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800', pt: 'new_dish' },
  { t: '2x1 en Cocteles', b: 'DESCUENTO', d: 'Todos los cocteles de la carta 2x1 de 6 a 9 PM.', p: '2x1', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800', pt: 'discount' },
  { t: 'Noches de Karaoke', b: 'GENERAL', d: 'Todos los jueves: noche de karaoke. Gana una cena gratis.', p: '', img: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800', pt: 'general' },
  { t: 'Promo: Taco Tuesday', b: 'PROMO', d: 'Todos los martes: tacos a $15 pesos. Valido de 5 a 10 PM.', p: '$15 c/u', img: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800', pt: 'promo' },
  { t: 'Nuevo: Aguas Frescas', b: 'PLATILLO', d: 'Aguas frescas naturales de horchata, jamaica y tamarindo.', p: '$35', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', pt: 'new_dish' },
  { t: 'Combo Hamburguesa', b: 'PROMO', d: 'Hamburguesa artesanal + papas + refresco por $129.', p: '$129', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', pt: 'promo' },
  { t: 'Nuevo: Ensalada de la Casa', b: 'PLATILLO', d: 'Ensalada fresca con aderezo de la casa. Opcion vegana disponible.', p: '$85', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', pt: 'new_dish' },
  { t: 'Descuento en Vinos', b: 'DESCUENTO', d: '30% off en todas las copas de vino despues de las 8 PM.', p: '30% OFF', img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800', pt: 'discount' },
  { t: 'Cena de Fin de Semana', b: 'GENERAL', d: 'Cena especial los sabados con musica en vivo. Reserva con anticipacion.', p: '', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', pt: 'general' },
  { t: 'Promo: 3x2 en Tortas', b: 'PROMO', d: 'Lleva 3 tortas por el precio de 2. Todas las variedades.', p: '$220', img: 'https://images.unsplash.com/photo-1567306301408-9f74779f0af8?w=800', pt: 'promo' },
  { t: 'Nuevo: Pizza de la Casa', b: 'PLATILLO', d: 'Pizza artesanal horneada en horno de lena. Ingredientes frescos.', p: '$150', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', pt: 'new_dish' },
  { t: '2x1 en Refrescos', b: 'DESCUENTO', d: 'Todos los refrescos 2x1 de 3 a 6 PM.', p: '2x1', img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800', pt: 'discount' },
  { t: 'Campeonato de Futbolito', b: 'GENERAL', d: 'Inscribete al torneo de futbolito. Premio: cena para dos.', p: '', img: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800', pt: 'general' },
  { t: 'Promo: Orden de Sopes', b: 'PROMO', d: 'Orden de 4 sopes con tu acompanamiento favorito.', p: '$80', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', pt: 'promo' },
  { t: 'Nuevo Postre: Flan Napolitano', b: 'PLATILLO', d: 'Flan napolitano hecho en casa. Porciones individuales.', p: '$55', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', pt: 'new_dish' },
];

const ARRE_POSTS = [
  { t: 'Noche de Jazz en Vivo', b: 'EVENTO', d: 'Trio de jazz todos los viernes. Cover $100 consumo minimo.', p: '$100', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' },
  { t: 'DJ Set: Noche Electronica', b: 'EVENTO', d: 'DJ invitado desde CDMX. Musica electronica hasta las 3 AM.', p: '$150', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800' },
  { t: 'Banda de Rock en Vivo', b: 'EVENTO', d: 'Rock nacional e internacional con bandas locales.', p: '$120', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' },
  { t: 'Noche de Salsa y Bachata', b: 'EVENTO', d: 'Clase gratuita de salsa a las 9 PM. Despues pista libre.', p: '$80', img: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800' },
  { t: 'Open Mic: Talento Local', b: 'EVENTO', d: 'Escenario abierto para musicos locales. Inscribete al llegar.', p: '$50', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800' },
  { t: 'Noche de Comedia', b: 'EVENTO', d: 'Stand-up comedy con comediantes locales. Risas aseguradas.', p: '$100', img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800' },
  { t: 'Fiesta de los 80s', b: 'EVENTO', d: 'Musica de los 80s, cocteles de epoca y dress code retro.', p: '$180', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800' },
  { t: 'Percusion en Vivo', b: 'EVENTO', d: 'Taller y presentacion de percusion africana y latina.', p: '$70', img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800' },
  { t: 'Noche de Boleros', b: 'EVENTO', d: 'Trio de boleros romanticos. Cena especial de pareja.', p: '$250', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800' },
  { t: 'Prendiendo: Reggaeton & Urbano', b: 'EVENTO', d: 'DJ invitado especial. Perreo hasta que el cuerpo aguante.', p: '$130', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d0e5d?w=800' },
];

function makeDocJson(post) {
  return JSON.stringify({
    badge: post.b,
    price: post.p,
    descripciones: [post.d],
    titulo: post.t,
    nombre_platillo: post.t,
    texto_promo: post.t,
  });
}

async function main() {
  const pool = await sql.connect(config);
  console.log('Connected to ATLX_ANTOJADOS_APP');

  // VAS IR - 20 posts
  for (let i = 0; i < VAS_IR_POSTS.length; i++) {
    const post = VAS_IR_POSTS[i];
    const id = crypto.randomUUID();
    const docJson = makeDocJson(post);
    try {
      await pool.request()
        .input('biz_post_id', sql.NVarChar(64), id)
        .input('publisher_user_id', sql.NVarChar(64), SPONSOR_ID)
        .input('channel', sql.NVarChar(30), 'vas_ir')
        .input('feed_type', sql.NVarChar(30), 'default')
        .input('media_url', sql.NVarChar(500), post.img)
        .input('doc_json', sql.NVarChar(sql.MAX), docJson)
        .input('title', sql.NVarChar(200), post.t)
        .input('body', sql.NVarChar(sql.MAX), post.d)
        .input('post_type', sql.NVarChar(20), post.pt)
        .input('status', sql.NVarChar(20), 'active')
        .query(`
          INSERT INTO antojados_core.biz_posts
            (biz_post_id, publisher_user_id, channel, feed_type, media_url, doc_json, title, body, post_type, status, likes_count, comments_count, views_count, shares_count, created_at)
          VALUES
            (@biz_post_id, @publisher_user_id, @channel, @feed_type, @media_url, @doc_json, @title, @body, @post_type, @status, 5, 2, 42, 1, DATEADD(day, -${i}, GETUTCDATE()))
        `);
      console.log(`[VAS IR ${i+1}/20] ${post.b}: ${post.t.substring(0, 30)}... OK`);
    } catch (e) {
      console.error(`[VAS IR ${i+1}] ERROR: ${e.message}`);
    }
  }

  // ARRE - 10 posts
  for (let i = 0; i < ARRE_POSTS.length; i++) {
    const post = ARRE_POSTS[i];
    const id = crypto.randomUUID();
    const docJson = makeDocJson(post);
    try {
      await pool.request()
        .input('biz_post_id', sql.NVarChar(64), id)
        .input('publisher_user_id', sql.NVarChar(64), SPONSOR_ID)
        .input('channel', sql.NVarChar(30), 'arre')
        .input('feed_type', sql.NVarChar(30), 'event')
        .input('media_url', sql.NVarChar(500), post.img)
        .input('doc_json', sql.NVarChar(sql.MAX), docJson)
        .input('title', sql.NVarChar(200), post.t)
        .input('body', sql.NVarChar(sql.MAX), post.d)
        .input('post_type', sql.NVarChar(20), 'event')
        .input('status', sql.NVarChar(20), 'active')
        .input('venue_name', sql.NVarChar(200), VENUE_NAME)
        .input('place_id', sql.NVarChar(64), PLACE_ID)
        .query(`
          INSERT INTO antojados_core.biz_posts
            (biz_post_id, publisher_user_id, channel, feed_type, media_url, doc_json, title, body, post_type, status, venue_name, place_id, likes_count, comments_count, views_count, shares_count, created_at)
          VALUES
            (@biz_post_id, @publisher_user_id, @channel, @feed_type, @media_url, @doc_json, @title, @body, @post_type, @status, @venue_name, @place_id, 3, 1, 28, 0, DATEADD(day, -${i}, GETUTCDATE()))
        `);
      console.log(`[ARRE ${i+1}/10] ${post.b}: ${post.t.substring(0, 30)}... OK`);
    } catch (e) {
      console.error(`[ARRE ${i+1}] ERROR: ${e.message}`);
    }
  }

  await pool.close();
  console.log('\n✅ SEED COMPLETADO: 20 VAS IR + 10 ARRE');
}

main().catch(console.error);
