#!/usr/bin/env node
/**
 * seed-publish.cjs
 *
 * Simula el flujo FAB PUBLISH: POST /api/v1/antojados/biz/posts
 * Usa SOLO los 5 campos de feed.md §1, §5:
 *   sponsor_id, channel, feed_type, media_url, doc_json
 *
 * doc_json: solo { badge, price, descripciones[] }
 * feed_type: 'publicity' (feed.md §11.2)
 * channel: 'vas_ir' o 'arre'
 *
 * NO USA: INSERT directo, place_id, publisher_user_id, title, body,
 *         post_type, publication_type, venue_name, GENERAL
 *
 * Uso: node scripts/seed-publish.cjs
 */

const API = 'https://api.antojadosmx.mx/api/v1/antojados/biz/posts';
const SPONSOR_ID = 'spon_demo_001';

// ── VAS IR - 20 posts ─────────────────────────────────────
const VAS_IR_POSTS = [
  { b: 'PLATILLO',  d: 'Nuestro nuevo taco de birria estilo Jalisco. Consomé incluido.',                                    p: '$45 c/u' },
  { b: 'PLATILLO',  d: 'Molletes con frijoles refritos, queso gratinado y pico de gallo.',                                  p: '$75'     },
  { b: 'PLATILLO',  d: 'Aguas frescas naturales de horchata, jamaica y tamarindo.',                                          p: '$35'     },
  { b: 'PLATILLO',  d: 'Ensalada fresca con aderezo de la casa. Opción vegana disponible.',                                  p: '$85'     },
  { b: 'PLATILLO',  d: 'Pizza artesanal horneada en horno de leña. Ingredientes frescos.',                                   p: '$150'    },
  { b: 'PLATILLO',  d: 'Flan napolitano hecho en casa. Porciones individuales.',                                              p: '$55'     },
  { b: 'PROMO',     d: 'Dos órdenes de tacos al pastor por el precio de una. Válido toda la semana.',                       p: '$120'    },
  { b: 'PROMO',     d: 'Burrito gigante con tu refresco favorito por solo $99.',                                             p: '$99'     },
  { b: 'PROMO',     d: 'Ambiente familiar los domingos. Descuento en cuenta para grupos de 4+',                              p: '15% OFF' },
  { b: 'PROMO',     d: 'Todos los martes: tacos a $15 pesos. Válido de 5 a 10 PM.',                                          p: '$15 c/u' },
  { b: 'PROMO',     d: 'Hamburguesa artesanal + papas + refresco por $129.',                                                 p: '$129'    },
  { b: 'PROMO',     d: 'Lleva 3 tortas por el precio de 2. Todas las variedades.',                                           p: '$220'    },
  { b: 'PROMO',     d: 'Orden de 4 sopes con tu acompañamiento favorito.',                                                    p: '$80'     },
  { b: 'DESCUENTO', d: '20% off en todas las cervezas artesanales locales. Happy hour extendido.',                          p: '20% OFF' },
  { b: 'DESCUENTO', d: 'Todos los cocteles de la carta 2x1 de 6 a 9 PM.',                                                    p: '2x1'     },
  { b: 'DESCUENTO', d: '30% off en todas las copas de vino después de las 8 PM.',                                            p: '30% OFF' },
  { b: 'DESCUENTO', d: 'Todos los refrescos 2x1 de 3 a 6 PM.',                                                               p: '2x1'     },
  { b: 'PROMO',     d: 'Ahora abrimos hasta las 2 AM los fines de semana. Barra libre hasta media noche.',                  p: ''        },
  { b: 'PROMO',     d: 'Todos los jueves: noche de karaoke. Gana una cena gratis.',                                          p: ''        },
  { b: 'PROMO',     d: 'Inscríbete al torneo de futbolito. Premio: cena para dos.',                                          p: ''        },
];

// ── ARRE - 10 posts ───────────────────────────────────────
const ARRE_POSTS = [
  { b: 'EVENTO', d: 'Trío de jazz todos los viernes. Cover $100 consumo mínimo.',             p: '$100' },
  { b: 'EVENTO', d: 'DJ invitado desde CDMX. Música electrónica hasta las 3 AM.',             p: '$150' },
  { b: 'EVENTO', d: 'Rock nacional e internacional con bandas locales.',                      p: '$120' },
  { b: 'EVENTO', d: 'Clase gratuita de salsa a las 9 PM. Después pista libre.',                p: '$80'  },
  { b: 'EVENTO', d: 'Escenario abierto para músicos locales. Inscríbete al llegar.',           p: '$50'  },
  { b: 'EVENTO', d: 'Stand-up comedy con comediantes locales. Risas aseguradas.',              p: '$100' },
  { b: 'EVENTO', d: 'Música de los 80s, cocteles de época y dress code retro.',                p: '$180' },
  { b: 'EVENTO', d: 'Taller y presentación de percusión africana y latina.',                   p: '$70'  },
  { b: 'EVENTO', d: 'Trío de boleros románticos. Cena especial de pareja.',                    p: '$250' },
  { b: 'EVENTO', d: 'DJ invitado especial. Perreo hasta que el cuerpo aguante.',               p: '$130' },
];

async function main() {
  let ok = 0, fail = 0;

  async function publish(channel, label, post, index, total) {
    const media_url = `https://api.antojadosmx.mx/placeholder/${channel}_${index}.jpg`;
    const doc_json = { badge: post.b, price: post.p, descripciones: [post.d] };
    
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsor_id: SPONSOR_ID,
          channel,
          feed_type: 'publicity',
          media_url,
          doc_json,
        }),
      });
      const data = await res.json();
      if (data.biz_post_id) {
        console.log(`[${label} ${index}/${total}] ${post.b}: ${post.d.substring(0, 25)}... ✓ ${data.biz_post_id.substring(0, 8)}`);
        ok++;
      } else {
        console.error(`[${label} ${index}] ERROR: ${JSON.stringify(data)}`);
        fail++;
      }
    } catch (e) {
      console.error(`[${label} ${index}] ERROR: ${e.message}`);
      fail++;
    }
  }

  console.log(`Seed via ${API}`);
  console.log(`Sponsor: ${SPONSOR_ID}`);
  console.log(`feed_type: publicity (feed.md §11.2)`);
  console.log(`doc_json: solo badge, price, descripciones`);
  console.log('');

  for (let i = 0; i < VAS_IR_POSTS.length; i++) {
    await publish('vas_ir', 'VAS IR', VAS_IR_POSTS[i], i + 1, VAS_IR_POSTS.length);
  }

  for (let i = 0; i < ARRE_POSTS.length; i++) {
    await publish('arre', 'ARRE', ARRE_POSTS[i], i + 1, ARRE_POSTS.length);
  }

  console.log('');
  console.log(`✅ COMPLETADO: ${ok} OK, ${fail} FAIL`);
  console.log(`   VAS IR: ${VAS_IR_POSTS.length} | ARRE: ${ARRE_POSTS.length}`);
}

main().catch(console.error);
