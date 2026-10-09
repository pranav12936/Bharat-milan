import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";

import {
  canAccessObject,
  getObjectAclPolicy,
  type ObjectAclPolicy,
  ObjectPermission,
  setObjectAclPolicy,
} from "./objectAcl";

/**
 * Local object storage for development.
 *
 * Files are stored at:
 *
 *   <project-root>/local-storage/objects/uploads/<objectId>
 *
 * This replaces the Replit Object Storage implementation so the project
 * can run completely locally on Windows without:
 *
 * - PRIVATE_OBJECT_DIR
 * - PUBLIC_OBJECT_SEARCH_PATHS
 * - Replit sidecar
 * - Google Cloud Storage
 */

const LOCAL_STORAGE_ROOT = path.resolve(
  process.cwd(),
  "local-storage",
);

const PRIVATE_STORAGE_ROOT = path.join(
  LOCAL_STORAGE_ROOT,
  "objects",
);

const UPLOAD_STORAGE_ROOT = path.join(
  PRIVATE_STORAGE_ROOT,
  "uploads",
);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {
    void this.ensureStorageDirectories();
  }

  /**
   * Make sure the local storage folders exist.
   */
  async ensureStorageDirectories(): Promise<void> {
    await fs.mkdir(UPLOAD_STORAGE_ROOT, {
      recursive: true,
    });
  }

  /**
   * There is no separate public bucket in local development.
   */
  getPublicObjectSearchPaths(): string[] {
    return [];
  }

  /**
   * Kept for compatibility with the existing storage routes.
   *
   * The old Replit implementation returned something such as:
   *   /bucket-name
   *
   * Our local implementation uses:
   *   /objects
   */
  getPrivateObjectDir(): string {
    return "/objects";
  }

  /**
   * Generate the local upload URL.
   *
   * The browser will subsequently PUT the actual image to this URL.
   */
  async getObjectEntityUploadURL(): Promise<string> {
    await this.ensureStorageDirectories();

    const objectId = randomUUID();

    return `/api/storage/uploads/${objectId}`;
  }

  /**
   * Convert a returned upload URL into the application's object path.
   *
   * Example:
   *
   *   /api/storage/uploads/abc
   *
   * becomes:
   *
   *   /objects/uploads/abc
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath) {
      return rawPath;
    }

    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    const match = rawPath.match(
      /\/api\/storage\/uploads\/([^/?#]+)/,
    );

    if (match?.[1]) {
      return `/objects/uploads/${match[1]}`;
    }

    return rawPath;
  }

  /**
   * Save an uploaded file to local disk.
   *
   * This is called by:
   *
   * PUT /api/storage/uploads/:objectId
   */
  async saveUploadedObject(
    objectId: string,
    data: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.ensureStorageDirectories();

    if (!objectId || !/^[a-zA-Z0-9_-]+$/.test(objectId)) {
      throw new Error("Invalid upload object ID");
    }

    if (!Buffer.isBuffer(data)) {
      throw new Error("Invalid upload data");
    }

    const filePath = path.join(
      UPLOAD_STORAGE_ROOT,
      objectId,
    );

    await fs.writeFile(filePath, data);

    /**
     * Store basic metadata beside the file.
     */
    const metadataPath = `${filePath}.json`;

    await fs.writeFile(
      metadataPath,
      JSON.stringify(
        {
          objectId,
          contentType,
          size: data.length,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );

    return `/objects/uploads/${objectId}`;
  }

  /**
   * Resolve an application object path to a local file.
   *
   * Example:
   *
   *   /objects/uploads/abc
   *
   * maps to:
   *
   *   local-storage/objects/uploads/abc
   */
  async getObjectEntityFile(
    objectPath: string,
  ): Promise<LocalObjectFile> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const relativePath = objectPath
      .slice("/objects/".length)
      .replace(/\\/g, "/");

    if (
      !relativePath ||
      relativePath.includes("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new ObjectNotFoundError();
    }

    const filePath = path.resolve(
      PRIVATE_STORAGE_ROOT,
      relativePath,
    );

    const root = path.resolve(PRIVATE_STORAGE_ROOT);

    if (
      filePath !== root &&
      !filePath.startsWith(`${root}${path.sep}`)
    ) {
      throw new ObjectNotFoundError();
    }

    try {
      const stat = await fs.stat(filePath);

      if (!stat.isFile()) {
        throw new ObjectNotFoundError();
      }
    } catch {
      throw new ObjectNotFoundError();
    }

    let contentType = "application/octet-stream";

    const metadataPath = `${filePath}.json`;

    try {
      const metadataText = await fs.readFile(
        metadataPath,
        "utf8",
      );

      const metadata = JSON.parse(metadataText) as {
        contentType?: string;
      };

      if (
        metadata.contentType &&
        typeof metadata.contentType === "string"
      ) {
        contentType = metadata.contentType;
      }
    } catch {
      /**
       * Metadata is optional. If it does not exist, use the
       * generic binary content type.
       */
    }

    return {
      filePath,
      contentType,
    };
  }

  /**
   * Delete a local object and its metadata.
   */
  async deleteObjectEntity(
    objectPath: string,
  ): Promise<void> {
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("Invalid object path");
    }

    const file = await this.getObjectEntityFile(
      objectPath,
    );

    await fs.rm(file.filePath, {
      force: true,
    });

    await fs.rm(`${file.filePath}.json`, {
      force: true,
    });
  }

  /**
   * Download a local object as a Web Response.
   */
  async downloadObject(
    file: LocalObjectFile,
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const stat = await fs.stat(file.filePath);

    const nodeStream = (
      await import("fs")
    ).createReadStream(file.filePath);

    const webStream = Readable.toWeb(
      nodeStream,
    ) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      },
    });
  }

  /**
   * Public objects are not used by the local photo system.
   */
  async searchPublicObject(
    _filePath: string,
  ): Promise<LocalObjectFile | null> {
    return null;
  }

  /**
   * Store an ACL policy.
   *
   * The existing objectAcl implementation expects an object-like
   * storage file. LocalObjectFile therefore exposes the same basic
   * information it needs through the compatibility fields below.
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath =
      this.normalizeObjectEntityPath(rawPath);

    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile =
      await this.getObjectEntityFile(normalizedPath);

    /**
     * objectAcl.ts was originally written for the Replit/GCS
     * File object. If your application calls this method, the
     * ACL implementation may need to be made local as well.
     *
     * We still attempt the existing implementation here so
     * existing application code remains compatible.
     */
    await setObjectAclPolicy(
      objectFile as never,
      aclPolicy,
    );

    return normalizedPath;
  }

  /**
   * Check whether the current user can access an object.
   */
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: LocalObjectFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    /**
     * For local development, uploaded profile photos are private
     * application objects. Delegate to the existing ACL system
     * when possible.
     */
    try {
      return await canAccessObject({
        userId,
        objectFile: objectFile as never,
        requestedPermission:
          requestedPermission ?? ObjectPermission.READ,
      });
    } catch {
      /**
       * If the old Replit/GCS ACL implementation cannot operate
       * on the local object, authenticated access is handled by
       * the storage route itself.
       */
      return Boolean(userId);
    }
  }
}

/**
 * Minimal local replacement for the Google Cloud Storage File type.
 */
export interface LocalObjectFile {
  filePath: string;
  contentType: string;
}

export const objectStorageService =
  new ObjectStorageService();