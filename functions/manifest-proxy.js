export async function onRequest(context) {
  // 获取请求URL中的原始m3u8地址
  const { searchParams } = new URL(context.request.url);
  const targetUrl = searchParams.get('url');
  
  // 验证URL参数
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }
  
  try {
    // 请求原始m3u8内容
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return new Response(`Upstream server responded with ${response.status}`, {
        status: response.status
      });
    }
    
    // 获取内容并过滤广告分段
    const content = await response.text();
    const filteredContent = filterAdsFromM3U8(content);
    
    // 返回过滤后的内容，保持原始m3u8的Content-Type
    return new Response(filteredContent, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10' // 短期缓存
      }
    });
  } catch (error) {
    return new Response(`Error processing m3u8: ${error.message}`, {
      status: 500
    });
  }
}

// 过滤M3U8中的广告分段函数
function filterAdsFromM3U8(m3u8Content) {
  if (!m3u8Content) return '';
  
  // 按行分割M3U8内容
  const lines = m3u8Content.split('\n');
  const filteredLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 过滤掉包含#EXT-X-DISCONTINUITY的行
    if (!line.includes('#EXT-X-DISCONTINUITY')) {
      filteredLines.push(line);
    }
  }
  
  return filteredLines.join('\n');
}
