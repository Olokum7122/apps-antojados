'use strict';

const { getPool, sql } = require('./_shared');

async function publishBizPost({ sponsor_id, channel, feed_type, city_code, zone_code, media_url, doc_json }) {
  const req = getPool('antojados').request()
    .input('sponsor_id', sql.NVarChar(64), sponsor_id)
    .input('channel', sql.NVarChar(30), channel)
    .input('feed_type', sql.NVarChar(30), feed_type || null)
    .input('city_code', sql.NVarChar(20), city_code || null)
    .input('zone_code', sql.NVarChar(20), zone_code || null)
    .input('media_url', sql.NVarChar(500), media_url || null)
    .input('doc_json', sql.NVarChar(sql.MAX), doc_json ? (typeof doc_json === 'string' ? doc_json : JSON.stringify(doc_json)) : null)
    .output('biz_post_id', sql.NVarChar(64));
  const result = await req.execute('antojados_core.usp_publish_biz_post');
  return { biz_post_id: result.output.biz_post_id };
}

async function listBizPosts({ sponsor_id, channel, feed_type, limit, offset }) {
  const result = await getPool('antojados').request()
    .input('sponsorId', sql.NVarChar(64), sponsor_id || null)
    .input('channel', sql.NVarChar(30), channel || null)
    .input('feedType', sql.NVarChar(30), feed_type || null)
    .input('limit', sql.Int, limit || 20)
    .input('offset', sql.Int, offset || 0)
    .query(`
      SELECT biz_post_id, sponsor_id, channel, feed_type, media_url, doc_json,
             views_count, likes_count, comments_count, shares_count,
             cta_clicks_count, taps_whatsapp_count, taps_maps_count,
             engagement_score, status, created_at
      FROM antojados_core.biz_posts
      WHERE status = 'active'
        AND (@sponsorId IS NULL OR sponsor_id = @sponsorId)
        AND (@channel IS NULL OR channel = @channel)
        AND (@feedType IS NULL OR feed_type = @feedType)
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return result.recordset;
}

async function getBizPost(biz_post_id) {
  const result = await getPool('antojados').request()
    .input('bizPostId', sql.NVarChar(64), biz_post_id)
    .query(`
      SELECT biz_post_id, sponsor_id, channel, feed_type, media_url, doc_json,
             views_count, likes_count, comments_count, shares_count,
             cta_clicks_count, taps_whatsapp_count, taps_maps_count,
             engagement_score, status, created_at
      FROM antojados_core.biz_posts
      WHERE biz_post_id = @bizPostId AND status = 'active'
    `);
  return result.recordset[0] || null;
}

async function likeBizPost({ biz_post_id, user_id }) {
  await getPool('antojados').request()
    .input('biz_post_id', sql.NVarChar(64), biz_post_id)
    .input('user_id', sql.NVarChar(64), user_id)
    .execute('antojados_core.usp_biz_post_like');
  return { ok: true };
}

async function unlikeBizPost({ biz_post_id, user_id }) {
  await getPool('antojados').request()
    .input('biz_post_id', sql.NVarChar(64), biz_post_id)
    .input('user_id', sql.NVarChar(64), user_id)
    .execute('antojados_core.usp_biz_post_unlike');
  return { ok: true };
}

async function commentBizPost({ biz_post_id, user_id, content_text, parent_comment_id, created_at_client }) {
  await getPool('antojados').request()
    .input('biz_post_id', sql.NVarChar(64), biz_post_id)
    .input('user_id', sql.NVarChar(64), user_id)
    .input('interaction_type', sql.NVarChar(30), parent_comment_id ? 'reply_created' : 'comment_created')
    .input('parent_comment_id', sql.NVarChar(64), parent_comment_id || null)
    .input('content_text', sql.NVarChar(2000), content_text)
    .input('created_at_client', sql.DateTime2(3), created_at_client ? new Date(created_at_client) : null)
    .execute('antojados_core.usp_biz_post_comment');
  return { ok: true };
}

async function viewBizPost({ biz_post_id, user_id }) {
  await getPool('antojados').request()
    .input('biz_post_id', sql.NVarChar(64), biz_post_id)
    .input('user_id', sql.NVarChar(64), user_id)
    .execute('antojados_core.usp_biz_post_view');
  return { ok: true };
}

async function getBizPostInteractionsSummary({ biz_post_id, user_id }) {
  const result = await getPool('antojados').request()
    .input('biz_post_id', sql.NVarChar(64), biz_post_id)
    .input('user_id', sql.NVarChar(64), user_id)
    .execute('antojados_core.usp_biz_post_interactions_summary');
  return result.recordset[0] || { has_liked: false, likes_count: 0, comments_count: 0 };
}

async function deleteBizPost(biz_post_id) {
  const tr = new sql.Transaction(getPool('antojados'));
  try {
    await tr.begin();
    await new sql.Request(tr).input('bizPostId', sql.NVarChar(64), biz_post_id)
      .query('DELETE FROM antojados_core.biz_post_media WHERE post_id = @bizPostId');
    await new sql.Request(tr).input('bizPostId', sql.NVarChar(64), biz_post_id)
      .query('DELETE FROM antojados_core.biz_post_interactions WHERE biz_post_id = @bizPostId');
    await new sql.Request(tr).input('bizPostId', sql.NVarChar(64), biz_post_id)
      .query("UPDATE antojados_core.biz_posts SET status = 'deleted' WHERE biz_post_id = @bizPostId");
    await tr.commit();
  } catch (e) {
    try { await tr.rollback(); } catch (_) {}
    throw e;
  }
  return { ok: true };
}

module.exports = {
  publishBizPost,
  listBizPosts,
  getBizPost,
  likeBizPost,
  unlikeBizPost,
  commentBizPost,
  viewBizPost,
  getBizPostInteractionsSummary,
  deleteBizPost,
};
