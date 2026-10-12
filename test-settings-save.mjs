import http from 'http';

const zodFields = ['branchId','adminUsername','adminPassword','adminLoginVisible','leaderboardVisible','yearlyKingVisible','subscriptionVisible','revenueVisible','monthlyLeaderboardVisible','editHomepageVisible','currentMonthKingVisible','premiumPlanVisible','newcomerPlanVisible','npcVisible','bannerAutoPlay','parallaxEnabled','premiumPrice','newcomerPrice','quarterlyPrice','depositPrice','weekdayPrice','studentPrice','holidayPrice','paymentPlatform','bookingInfoVisible','sopVisible','branchFeatureVisibility','rainEffect','bookFlipEffect','pageBackgrounds','bookingCalendarVisible'];

function get(path) {
  return new Promise((resolve) => {
    http.get({hostname:'localhost',port:3000,path}, res => {
      let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve(JSON.parse(b)));
    });
  });
}
function post(path, body) {
  return new Promise((resolve) => {
    const req = http.request({hostname:'localhost',port:3000,path,method:'POST',headers:{'Content-Type':'application/json'}}, res => {
      let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve(JSON.parse(b)));
    });
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Get current settings
  const data = JSON.stringify({json:{branchId:1}});
  const resp = await get('/api/trpc/system.settings.get?input='+encodeURIComponent(data));
  const settings = resp.result.data.json;
  
  const extraFields = Object.keys(settings).filter(k => !zodFields.includes(k));
  console.log('Extra fields not in zod schema:', extraFields);
  
  // 2. Simulate handleSaveSettings: send all non-null fields
  const updates = {};
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && value !== null) updates[key] = value;
  }
  console.log('Sending update with keys:', Object.keys(updates).length, 'fields');
  console.log('leaderboardVisible before:', updates.leaderboardVisible);
  
  // Change one field
  updates.leaderboardVisible = false;
  
  // Send without branchId (like the bug)
  const result = await post('/api/trpc/system.settings.update', {json: updates});
  console.log('Update result:', JSON.stringify(result).slice(0, 100));
  
  // 3. Read back
  const resp2 = await get('/api/trpc/system.settings.get?input='+encodeURIComponent(data));
  const after = resp2.result.data.json;
  console.log('After save - leaderboardVisible:', after.leaderboardVisible);
}
main();
