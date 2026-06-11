import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  /** Skill slug, e.g. "electrician". */
  @IsString()
  skill!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  /** Broadcast radius in metres. */
  @IsInt()
  @Min(100)
  @Max(100000)
  radius!: number;
}
