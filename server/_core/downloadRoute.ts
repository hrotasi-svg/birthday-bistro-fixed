import type { Express } from "express";
import { ENV } from "./env";

/**
 * Provides a proper file download endpoint that triggers the system download manager
 * on mobile devices. Instead of using fetch+blob (which doesn't show download notifications),
 * this endpoint fetches the file from S3 and streams it back with Content-Disposition: attachment.
 */
export function registerDownloadRoute(app: Express) {
  app.get("/api/download-video", async (req, res) => {
    const fileKey = req.query.fileKey as string;
    const filename = req.query.filename as string || "video.mp4";

    if (!fileKey) {
      res.status(400).send("Missing fileKey parameter");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage not configured");
      return;
    }

    try {
      // Get a signed URL from S3
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", fileKey.replace(/^\/+/, ""));

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        console.error(`[Download] forge error: ${forgeResp.status}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL");
        return;
      }

      // Fetch the actual file from S3
      const fileResp = await fetch(url);
      if (!fileResp.ok) {
        res.status(502).send("Failed to fetch file from storage");
        return;
      }

      // Set headers to force download on mobile
      const contentType = fileResp.headers.get("content-type") || "video/mp4";
      const contentLength = fileResp.headers.get("content-length");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Cache-Control", "no-store");

      // Stream the file to the client
      const reader = fileResp.body?.getReader();
      if (!reader) {
        res.status(502).send("No response body");
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err) {
      console.error("[Download] error:", err);
      if (!res.headersSent) {
        res.status(500).send("Download failed");
      }
    }
  });
}

