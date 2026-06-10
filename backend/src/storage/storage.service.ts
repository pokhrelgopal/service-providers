import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Client } from 'minio';
import sharp from 'sharp';
import { MINIO_CLIENT } from './storage.constants';
import type { Env } from '../config/env.validation';

/** Seconds a presigned upload (PUT) URL stays valid. */
const PRESIGN_PUT_TTL = 5 * 60;
/** Seconds a presigned view (GET) URL stays valid — longer so images don't
 * expire mid-session (next/image proxies/caches them server-side). */
const PRESIGN_GET_TTL = 60 * 60;

/**
 * Thin wrapper over the MinIO client. Ensures the app bucket exists on boot and
 * exposes the client + bucket for the presigned-upload flows added in M4.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(MINIO_CLIENT) private readonly client: Client,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get minio(): Client {
    return this.client;
  }

  get bucket(): string {
    return this.config.get('MINIO_BUCKET', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket "${this.bucket}"`);
      }
    } catch (err) {
      // Don't crash boot if MinIO is briefly unavailable — /health will report it.
      this.logger.warn(
        `Could not ensure MinIO bucket "${this.bucket}": ${(err as Error).message}`,
      );
    }
  }

  /** Presigned PUT URL the client uploads the original file to directly. */
  presignedPut(objectKey: string): Promise<string> {
    return this.client.presignedPutObject(
      this.bucket,
      objectKey,
      PRESIGN_PUT_TTL,
    );
  }

  /** Presigned GET URL for viewing a private object. */
  presignedGet(objectKey: string): Promise<string> {
    return this.client.presignedGetObject(
      this.bucket,
      objectKey,
      PRESIGN_GET_TTL,
    );
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async remove(objectKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectKey);
    } catch (err) {
      this.logger.warn(
        `Failed to remove "${objectKey}": ${(err as Error).message}`,
      );
    }
  }

  /**
   * Reads an uploaded image, generates a small JPEG thumbnail, stores it, and
   * returns the thumbnail object key. Returns null if the source isn't a
   * processable image (best-effort — thumbnails are non-critical).
   */
  async generateThumbnail(objectKey: string): Promise<string | null> {
    try {
      const stream = await this.client.getObject(this.bucket, objectKey);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      const input = Buffer.concat(chunks);

      const thumb = await sharp(input)
        .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${objectKey}.thumb.jpg`;
      await this.client.putObject(
        this.bucket,
        thumbnailKey,
        thumb,
        thumb.length,
        {
          'Content-Type': 'image/jpeg',
        },
      );
      return thumbnailKey;
    } catch (err) {
      this.logger.warn(
        `Thumbnail generation failed for "${objectKey}": ${(err as Error).message}`,
      );
      return null;
    }
  }
}
