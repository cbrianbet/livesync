import { StageManifestCommand } from '../stage-manifest.command';
import {
  CommandHandler,
  EventBus,
  EventPublisher,
  ICommandHandler,
} from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { Manifest } from '../../../../domain/manifest.entity';
import { StageHandshakeCommand } from '../stage-handshake.command';

@CommandHandler(StageHandshakeCommand)
export class StageHandshakeHandler
  implements ICommandHandler<StageHandshakeCommand> {
  constructor(
    @InjectRepository(Manifest)
    private readonly repository: Repository<Manifest>,
    private readonly publisher: EventPublisher,
  ) {
  }

  async execute(command: StageHandshakeCommand): Promise<any> {
    for (const handshake of command.handshakes) {
      Logger.log(`procssing Handshake logged: ${handshake.id}`);
      const existing = await this.repository.findOne(handshake.id);
      if (existing) {
        const manifest = plainToClass(Manifest, existing);
        manifest.updateSession(handshake.end);
        await this.repository.save(manifest);
        Logger.log(`Handshake ${manifest.facilityCode}-${manifest.facilityName}`);
        this.publisher.mergeObjectContext(manifest).commit();
      }
    }
    return command.handshakes;
  }
}
