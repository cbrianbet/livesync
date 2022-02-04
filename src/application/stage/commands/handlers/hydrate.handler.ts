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
import { HydrateCommand } from '../hydrate.command';

@CommandHandler(HydrateCommand)
export class HydrateHandler implements ICommandHandler<HydrateCommand> {
  constructor(
    @InjectRepository(Manifest)
    private readonly repository: Repository<Manifest>,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: HydrateCommand): Promise<any> {
    for (const code of command.hydrateDto.codes) {
      Logger.log(`hydrating site code ${code} Handshake`);
      const existing = await this.repository.findOne(
        { facilityCode: code, docket: command.hydrateDto.docket },
        {
          order: {
            end: 'DESC',
          },
        },
      );
      if (existing) {
        const manifest = plainToClass(Manifest, existing);
        manifest.hydrateSession();
        await this.repository.save(manifest);
        Logger.log(
          `Hydrate Handshake ${manifest.facilityCode}-${manifest.facilityName}`,
        );
        this.publisher.mergeObjectContext(manifest).commit();
      }
    }
    return command.hydrateDto;
  }
}
