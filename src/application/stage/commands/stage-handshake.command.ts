import { HandshakeDto } from '../../../domain/dto/handshake.dto';

export class StageHandshakeCommand {
  constructor(public handshakes: HandshakeDto[]) {
  }
}
