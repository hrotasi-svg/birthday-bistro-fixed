# Fix Notes - Batch 5 BUGs

## BUG 1: Revenue save not working
- The API works correctly (tested via curl)
- The frontend code at line 326-341 looks correct
- Need to test in browser to see if there's a UI issue (maybe detailBooking is null or the useEffect resets the values)
- The useEffect at line 128-139 resets detailRevenue whenever detailRevenueData changes - this could be the issue if the query refetches after mutation

## BUG 2: Preview button not playing video
- Current implementation at line 744: opens new window with document.write() and a <video> tag
- Problem: The videoUrl is a relative path like `/manus-storage/videos/evt450001_...mp4`
- When opening a new window with document.write(), the relative URL might not resolve correctly
- Fix: Use absolute URL (window.location.origin + videoUrl) or show inline modal instead

## BUG 3: Download not working on mobile
- Current implementation: fetch + blob + createObjectURL + a.click()
- Problem on mobile: This approach doesn't trigger the system download manager on mobile browsers
- Mobile browsers (Safari/Chrome) don't show download notifications for blob URLs
- Fix: Need a proper server-side download endpoint that returns the file with Content-Disposition: attachment header
- The backend already has a `shortVideo.getDownloadUrl` endpoint that returns a signed URL
- Better approach: Use window.open() or window.location.href to a server endpoint that streams the file with proper headers

## BUG 4: Frontend upload works but backend can't download
- This is the same as BUG 3 - the upload works (verified), but download doesn't work on mobile

## Key files:
- AdminDashboard.tsx: lines 726-810 (short video management section)
- server/routers.ts: lines 379-470 (shortVideo router)
- server/db.ts: lines 648-657 (getShortVideosByEvent)
- server/storage.ts: storageGetSignedUrl function

## Solution for download:
Create a proper download API endpoint that:
1. Takes videoId as parameter
2. Gets the file from S3 using storageGet
3. Streams it back with Content-Disposition: attachment; filename="xxx.mp4"
4. Frontend uses window.location.href = `/api/download-video?id=xxx` to trigger real download
