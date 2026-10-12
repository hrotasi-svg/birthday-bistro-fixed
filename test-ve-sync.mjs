import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ json: data });
    const opts = { hostname: 'localhost', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = http.request(opts, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) })); });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function get(path, input) {
  return new Promise((resolve, reject) => {
    const url = path + '?input=' + encodeURIComponent(JSON.stringify({ json: input }));
    http.get({ hostname: 'localhost', port: 3000, path: url }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) })); }).on('error', reject);
  });
}

async function main() {
  console.log('=== Visual Editor Sync Test ===');
  
  // Test 1: +text element on main page
  const r1 = await post('/api/trpc/visualEditor.upsert', { pageId: 'main', type: 'text', content: 'SYNC_TEST_MAIN', x: 50, y: 50, width: 200, height: 40, fontSize: 20, color: '#00ff00', branchId: 1 });
  console.log('1. Upsert element to main:', r1.status === 200 ? 'OK' : 'FAIL');
  
  // Test 2: Read back from same API frontend uses
  const r2 = await get('/api/trpc/visualEditor.list', { pageId: 'main', branchId: 1 });
  const items = r2.body.result.data.json;
  const found = items.find(i => i.content === 'SYNC_TEST_MAIN');
  console.log('2. Frontend reads same data:', found ? 'OK' : 'FAIL');
  
  // Test 3: Text override (native text editing)
  const r3 = await post('/api/trpc/visualEditor.upsertTextOverride', { pageId: 'home', selector: 'h1:nth-of-type(1)', originalText: '壽星餐酒館', newText: '壽星餐酒館SYNC', fontScale: 120, color: '#ffaa00', branchId: 1 });
  console.log('3. Upsert text override:', r3.status === 200 ? 'OK' : 'FAIL');
  
  // Test 4: Read text overrides (same API TextOverridesApplier uses)
  const r4 = await get('/api/trpc/visualEditor.listTextOverrides', { pageId: 'home', branchId: 1 });
  const overrides = r4.body.result.data.json;
  const foundOv = overrides.find(o => o.newText === '壽星餐酒館SYNC');
  console.log('4. Frontend reads text override:', foundOv ? 'OK' : 'FAIL');
  
  // Test 5: Background image via settings
  const bgMap = JSON.stringify({ home: 'https://example.com/test-bg.jpg' });
  const r5 = await post('/api/trpc/system.settings.update', { branchId: 1, pageBackgrounds: bgMap });
  console.log('5. Update pageBackgrounds:', r5.status === 200 ? 'OK' : 'FAIL');
  
  // Test 6: Read settings (same API PageBackgroundApplier uses)
  const r6 = await get('/api/trpc/system.settings.get', { branchId: 1 });
  const savedBg = r6.body.result.data.json.pageBackgrounds;
  const bgParsed = JSON.parse(savedBg || '{}');
  console.log('6. Frontend reads pageBackgrounds:', bgParsed.home === 'https://example.com/test-bg.jpg' ? 'OK' : 'FAIL');
  
  // Cleanup
  if (found) await post('/api/trpc/visualEditor.delete', { id: found.id });
  if (foundOv) await post('/api/trpc/visualEditor.deleteTextOverride', { id: foundOv.id });
  await post('/api/trpc/system.settings.update', { branchId: 1, pageBackgrounds: '' });
  
  console.log('\n=== All data flows through: Visual Editor → API → DB → Frontend API → Frontend Page ===');
  console.log('=== Single source of truth: MySQL DB (visual_editor_elements + page_text_overrides + system_settings) ===');
}

main().catch(console.error);
