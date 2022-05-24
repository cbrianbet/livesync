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

@CommandHandler(SyncCommand)
export class SyncHandler implements ICommandHandler<SyncCommand> {
  constructor(
    @InjectRepository(Stats)
    private readonly repository: Repository<Stats>,
    private readonly commandBus: CommandBus,
    private readonly config: ConfigService,
    private readonly client: MessagingService,
  ) {}

  async execute(command: SyncCommand): Promise<any> {
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
        Logger.log('PUBLISHED');

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
  }
}
