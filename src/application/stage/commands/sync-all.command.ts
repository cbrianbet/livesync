import { ManifestDto } from '../../../domain/dto/manifest.dto';

export class SyncAllCommand {
  public constructor(public manifet: ManifestDto) {}
}
