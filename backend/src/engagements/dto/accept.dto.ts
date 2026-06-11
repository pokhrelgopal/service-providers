import { IsUUID } from 'class-validator';

export class AcceptDto {
  @IsUUID()
  requestId!: string;

  /** The responding provider's user id. */
  @IsUUID()
  providerId!: string;
}
