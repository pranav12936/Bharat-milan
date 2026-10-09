import { Readable } from "stream";
import { getAuth } from "@clerk/express";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";

import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function hasAuthenticatedSession(req: Request): boolean {
  return Boolean(getAuth(req).userId);
}

// ---------------------------------------------------------
// REQUEST UPLOAD URL
// ---------------------------------------------------------

router.post(
  "/storage/uploads/request-url",
  async (req: Request, res: Response) => {
    if (!hasAuthenticatedSession(req)) {
      res.status(401).json({
        error: "Unauthorized",
      });
      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Missing or invalid required fields",
      });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;

      // Local storage returns:
      // /api/storage/uploads/<objectId>
      const uploadPath =
        await objectStorageService.getObjectEntityUploadURL();

      // Convert relative URL to absolute URL.
      //
      // Example:
      // /api/storage/uploads/abc123
      //
      // becomes:
      // http://localhost:3000/api/storage/uploads/abc123
      const uploadURL = new URL(
        uploadPath,
        `${req.protocol}://${req.get("host")}`,
      ).toString();

      const objectPath =
        objectStorageService.normalizeObjectEntityPath(
          uploadPath,
        );

      const response = {
        uploadURL,
        objectPath,
        metadata: {
          name,
          size,
          contentType,
        },
      };

      res.json(
        RequestUploadUrlResponse.parse(response),
      );
    } catch (error) {
      req.log.error(
        { err: error },
        "Error generating upload URL",
      );

      res.status(500).json({
        error: "Failed to generate upload URL",
      });
    }
  },
);

// ---------------------------------------------------------
// ACTUAL FILE UPLOAD
// ---------------------------------------------------------

router.put(
  "/storage/uploads/:objectId",
  async (req: Request, res: Response) => {
    if (!hasAuthenticatedSession(req)) {
      res.status(401).json({
        error: "Unauthorized",
      });
      return;
    }

    try {
      const { objectId } = req.params;

      if (
        !objectId ||
        Array.isArray(objectId) ||
        !/^[a-zA-Z0-9_-]+$/.test(objectId)
      ) {
        res.status(400).json({
          error: "Invalid upload ID",
        });
        return;
      }

      const contentType =
        typeof req.headers["content-type"] === "string"
          ? req.headers["content-type"]
          : "application/octet-stream";

      const chunks: Buffer[] = [];

      for await (const chunk of req) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk),
        );
      }

      const data = Buffer.concat(chunks);

      if (data.length === 0) {
        res.status(400).json({
          error: "Uploaded file is empty",
        });
        return;
      }

      // Maximum file size = 5 MB
      if (data.length > 5 * 1024 * 1024) {
        res.status(413).json({
          error: "File is too large. Maximum size is 5 MB.",
        });
        return;
      }

      const objectPath =
        await objectStorageService.saveUploadedObject(
          objectId,
          data,
          contentType,
        );

      res.status(200).json({
        objectPath,
      });
    } catch (error) {
      req.log.error(
        { err: error },
        "Error saving uploaded object",
      );

      res.status(500).json({
        error: "Failed to save uploaded file",
      });
    }
  },
);

// ---------------------------------------------------------
// PUBLIC OBJECTS
// ---------------------------------------------------------

router.get(
  "/storage/public-objects/*filePath",
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;

      const filePath = Array.isArray(raw)
        ? raw.join("/")
        : raw;

      const file =
        await objectStorageService.searchPublicObject(
          filePath,
        );

      if (!file) {
        res.status(404).json({
          error: "File not found",
        });
        return;
      }

      const response =
        await objectStorageService.downloadObject(file);

      res.status(response.status);

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );

        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error(
        { err: error },
        "Error serving public object",
      );

      res.status(500).json({
        error: "Failed to serve public object",
      });
    }
  },
);
// ---------------------------------------------------------
// PRIVATE OBJECTS
// ---------------------------------------------------------

router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response) => {
    try {
      // User must be signed in to view profile photos
      if (!getAuth(req).userId) {
        res.status(401).json({
          error: "Unauthorized",
        });
        return;
      }

      const raw = req.params.path;

      const wildcardPath = Array.isArray(raw)
        ? raw.join("/")
        : raw;

      if (
        !wildcardPath ||
        wildcardPath.includes("..") ||
        wildcardPath.includes("\\")
      ) {
        res.status(400).json({
          error: "Invalid object path",
        });
        return;
      }

      const objectPath = `/objects/${wildcardPath}`;

      const objectFile =
        await objectStorageService.getObjectEntityFile(
          objectPath,
        );

      const response =
        await objectStorageService.downloadObject(
          objectFile,
          3600,
        );

      res.status(response.status);

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );

        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        req.log.warn(
          { err: error },
          "Object not found",
        );

        res.status(404).json({
          error: "Object not found",
        });

        return;
      }

      req.log.error(
        { err: error },
        "Error serving object",
      );

      res.status(500).json({
        error: "Failed to serve object",
      });
    }
  },
);
export default router;