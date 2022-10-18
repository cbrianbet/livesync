import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { SyncCommand } from '../sync.command';
import { InjectRepository } from '@nestjs/typeorm';
import { Stats } from '../../../../domain/stats.entity';
import { Like, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UpdateStatusCommand } from '../update-status.command';
import { ConfigService } from '../../../../config/config.service';
import { MessagingService } from '../../../../infrastructure/messging/messaging.service';
import { Manifest } from './../../../../domain/manifest.entity';

@CommandHandler(SyncCommand)
export class SyncHandler implements ICommandHandler<SyncCommand> {
  constructor(
    @InjectRepository(Stats)
    private readonly repository: Repository<Stats>,
    @InjectRepository(Manifest)
    private readonly manifestRepository: Repository<Manifest>,
    private readonly commandBus: CommandBus,
    private readonly config: ConfigService,
    private readonly client: MessagingService,
  ) {}

  async execute(command: SyncCommand): Promise<any> {
    try {
      const manifests = await this.manifestRepository
        .createQueryBuilder('s')
        .where('s.facilityCode = :facilityCode', {
          facilityCode: command.manifet.facilityCode,
        })
        .andWhere('s.docket like :docket', {
          docket: '%' + command.manifet.docket + '%',
        })
        .orderBy({
          's.statusDate': 'DESC',
        })
        .getMany();

      if (manifests) {
        manifests.forEach(async m => {
          try {
            const manifestResult = await this.client.publish(
              JSON.stringify(m),
              this.config.QueueStatsExchange,
              this.config.getRoute(Manifest.name.toLowerCase()),
            );
            Logger.log('PUBLISHED MANIFESTS');

            if (manifestResult) {
              await this.commandBus.execute(
                new UpdateStatusCommand(m.id, Manifest.name, 'SENT'),
              );
            } else {
              await this.commandBus.execute(
                new UpdateStatusCommand(
                  m.id,
                  Stats.name,
                  'ERROR',
                  'Unkown publish Error',
                ),
              );
            }
          } catch (e) {
            Logger.error(e);
            await this.commandBus.execute(
              new UpdateStatusCommand(m.id, Stats.name, 'ERROR', e),
            );
          }
        });
      }
    } catch (err) {
      Logger.error(err);
    }



    try {
      const stats = await this.repository
        .createQueryBuilder('s')
        .where('s.facilityCode = :facilityCode', {
          facilityCode: command.manifet.facilityCode,
        })
        .andWhere('s.docket like :docket', {
          docket: '%' + command.manifet.docket + '%',
        })
        .orderBy({
          's.updated': 'DESC',
        })
        .getOne();

      if (stats) {
        stats.manifestId = command.manifet.id;
        try {
          stats.docket = JSON.parse(stats.docket);
          stats.stats = JSON.parse(stats.stats);
          const result = await this.client.publish(
            JSON.stringify(stats),
            this.config.QueueStatsExchange,
            this.config.getRoute(Stats.name.toLowerCase()),
          );
          Logger.log('PUBLISHED STATS');

          if (result) {
            await this.commandBus.execute(
              new UpdateStatusCommand(stats.id, Stats.name, 'SENT'),
            );
          } else {
            await this.commandBus.execute(
              new UpdateStatusCommand(
                stats.id,
                Stats.name,
                'ERROR',
                'Unkown publish Error',
              ),
            );
          }
        } catch (e) {
          Logger.error(e);
          await this.commandBus.execute(
            new UpdateStatusCommand(stats.id, Stats.name, 'ERROR', e),
          );
        }
      }
      return stats;
    } catch (err) {
      Logger.error(err);
    }
  }
}
