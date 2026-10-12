import http from 'http';

function get(path, input) {
  return new Promise((resolve) => {
    const url = path + '?input=' + encodeURIComponent(JSON.stringify({ json: input }));
    http.get({ hostname: 'localhost', port: 3000, path: url }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
    });
  });
}

function post(path, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ json: data });
    const opts = { hostname: 'localhost', port: 3000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = http.request(opts, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b))); });
    req.write(body); req.end();
  });
}

async function main() {
  const res = await get('/api/trpc/monthlyKing.list', { branchId: 1 });
  const items = res.result.data.json;
  console.log('Total entries:', items.length);
  
  // Group by month, keep only first entry per month
  const byMonth = {};
  const toDelete = [];
  for (const item of items) {
    if (byMonth[item.month] === undefined) {
      byMonth[item.month] = item;
    } else {
      toDelete.push(item.id);
    }
  }
  console.log('Duplicates to delete:', toDelete.length);
  
  for (const id of toDelete) {
    await post('/api/trpc/monthlyKing.delete', { id });
  }
  console.log('Cleanup done');
  
  // Also delete entries with empty name (month 12 has empty name)
  const res2 = await get('/api/trpc/monthlyKing.list', { branchId: 1 });
  const items2 = res2.result.data.json;
  for (const item of items2) {
    if (item.name === '' && item.revenue === '') {
      await post('/api/trpc/monthlyKing.delete', { id: item.id });
      console.log('Deleted empty entry for month', item.month);
    }
  }
  
  // Final check
  const res3 = await get('/api/trpc/monthlyKing.list', { branchId: 1 });
  console.log('Final entries:', res3.result.data.json.length);
  res3.result.data.json.forEach(e => console.log(`  Month ${e.month}: ${e.name} - ${e.revenue}`));
}

main().catch(console.error);
