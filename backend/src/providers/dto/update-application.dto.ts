import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  legalName?: string;

  /** Local phone number (Nepal). Dial code is fixed to +977 server-side. */
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(15)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  serviceDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
