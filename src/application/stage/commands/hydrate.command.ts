import { HandshakeDto } from '../../../domain/dto/handshake.dto';
import { HydrateDto } from '../../../domain/dto/hydrate.dto';

export class HydrateCommand {
  constructor(public hydrateDto: HydrateDto) {}
}
