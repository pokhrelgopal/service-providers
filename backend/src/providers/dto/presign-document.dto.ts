import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { DocumentType } from '../document-type.enum';

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export class PresignDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;
}
