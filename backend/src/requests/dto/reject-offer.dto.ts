import { IsUUID } from 'class-validator';

export class RejectOfferDto {
  /** The responding provider's user id to reject. */
  @IsUUID()
  providerId!: string;
}
