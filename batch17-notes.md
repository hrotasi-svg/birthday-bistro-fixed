# Batch 17 Progress Notes

## Requirements (from pasted_content.txt)
1. Visual editor sync check + native text color editing ✅ (added color picker to VisualEditorNativeLayer)
2. Visual editor native text color change (same as +文字 editing) ✅
3. Yearly king toggle + display in leaderboard ✅ (yearlyKingVisible setting + LeaderboardPage yearly tab uses monthlyKingEntries)
4. Booking calendar frontend page (BookingCalendarPage.tsx) ✅ created
5. Booking calendar admin management (need to add admin tab + bookingCalendarVisible toggle)
6. Booking page date lock check (if 全日席位鎖定 → show warning) - TODO
7. Day session lock check - TODO
8. Night session lock check - TODO
9. LINE ID label text change ✅ (BookingPage.tsx)
10. LINE ID placeholder text change ✅ (BookingPage.tsx)
11. Terms checkbox ✅ (BookingPage.tsx)
12. Branch-based booking routing (city+district → branchId) - already done in batch 15
13. 費用方案 with cancel policy + checkbox after approval - TODO
14. Brand info text update ✅ (BrandInfoPage.tsx)
15. FAQ text update ✅ (BrandInfoPage.tsx)
16. Contact us text update ✅ (BrandInfoPage.tsx)
17. User terms page ✅ (BrandInfoPage.tsx added 使用者條款 section)

## Still TODO:
- ~~Register /booking-calendar route in App.tsx~~ ✅
- ~~Add 預約查詢 entry in MainFunctionPage~~ ✅
- ~~Add admin 預約查詢管理 tab with calendar + status selection~~ ✅
- ~~Add bookingCalendarVisible toggle in admin settings~~ ✅
- ~~Booking page date validation (items 6/7/8)~~ ✅
- ~~費用方案 after approval (item 13)~~ ✅
- Final test + checkpoint + 11 delivery files

## ALL 17 items DONE. Ready for final test + checkpoint.

## Key files modified:
- server/_core/systemRouter.ts: added yearlyKingVisible, bookingCalendarVisible
- server/routers.ts: added bookingCalendar router (listMonth, getDate, upsert)
- server/db.ts: added getBookingCalendarByMonth, upsertBookingCalendarStatus, getBookingCalendarStatus
- drizzle/schema.ts: added bookingCalendar table + bigint import
- client/src/pages/BookingCalendarPage.tsx: new calendar page
- client/src/pages/LeaderboardPage.tsx: yearly tab uses monthlyKingEntries with MVP
- client/src/pages/BookingPage.tsx: LINE ID text, placeholder, terms checkbox
- client/src/pages/BrandInfoPage.tsx: all text updated (14/15/16/17)
- client/src/components/VisualEditorNativeLayer.tsx: added color picker
- client/src/pages/AdminDashboard.tsx: yearlyKingVisible toggle added
