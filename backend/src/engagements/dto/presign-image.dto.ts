import { IsIn, IsString } from 'class-validator';

export const CHAT_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class PresignImageDto {
  @IsString()
  @IsIn(CHAT_IMAGE_MIME as readonly string[])
  contentType!: string;
}
