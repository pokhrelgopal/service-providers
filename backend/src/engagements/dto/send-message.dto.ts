import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body?: string;

  /** MinIO object key of a pre-uploaded image (from POST :id/image). */
  @IsOptional()
  @IsString()
  imageKey?: string;
}
