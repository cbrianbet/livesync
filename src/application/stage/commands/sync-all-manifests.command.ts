import { ManifestDto } from '../../../domain/dto/manifest.dto';
import { HydrateDto } from './../../../domain/dto/hydrate.dto';

export class SyncAllManifestsCommand {
  public constructor(public manifet: HydrateDto) {}
}
