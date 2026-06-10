import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { DocumentType } from '../document-type.enum';
import { MAX_UPLOAD_BYTES } from './presign-document.dto';

export class ConfirmDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  objectKey!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes!: number;
}
