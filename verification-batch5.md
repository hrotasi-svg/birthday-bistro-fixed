# Batch 5 Verification Results

## BUG 1: Revenue save ✓ VERIFIED
- Opened detail for booking "e" (id: 480001)
- Changed meal revenue from 15000 to 20000
- Clicked "保存營業收入"
- Toast: "營業收入已保存" ✓
- Total auto-calculated: 20000 + 10000 = 30000 ✓
- Cashback auto-calculated: 30000 * 0.5 = 15000 ✓
- Values persist after save (not reset by useEffect) ✓
- The booking list now shows "當日營業額: NT$30,000" ✓

## BUG 2: Preview button - testing next
## BUG 3: Download button - testing next
## BUG 4: Frontend upload → backend download - testing next

## Video Management Display ✓ VERIFIED
- Selected booking "e — 2026-07-17" → eventId 450001 auto-loaded
- Selected position "攝影" → shows 5 storyboards
- 中景: has video → shows 預覽 + 下載影片 buttons ✓
- 特寫: has video → shows 預覽 + 下載影片 buttons ✓
- 廣角: no video → shows 尚無影片 ✓
- 遠景: no video → shows 尚無影片 ✓
- 自拍: no video → shows 尚無影片 ✓
- Bottom: 全部下載 + 全部刪除 buttons ✓
