import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  /** Search radius in metres (default 5km, capped at 100km). */
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(100_000)
  @IsOptional()
  radius: number = 5000;

  /** Optional skill slug filter. */
  @IsString()
  @IsOptional()
  skill?: string;
}
