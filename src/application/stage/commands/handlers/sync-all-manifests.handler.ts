import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Stats } from '../../../../domain/stats.entity';
import { Like, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UpdateStatusCommand } from '../update-status.command';
import { ConfigService } from '../../../../config/config.service';
import { MessagingService } from '../../../../infrastructure/messging/messaging.service';
import { Manifest } from '../../../../domain/manifest.entity';
import { Indicator } from '../../../../domain/indicator.entity';
import { Metric } from '../../../../domain/metric.entity';
import { SyncAllManifestsCommand } from './../sync-all-manifests.command';

@CommandHandler(SyncAllManifestsCommand)
export class SyncAllManifestsHandler
  implements ICommandHandler<SyncAllManifestsCommand> {
  constructor(
    @InjectRepository(Stats)
    private readonly repository: Repository<Stats>,
    @InjectRepository(Manifest)
    private readonly manifestRepository: Repository<Manifest>,
    @InjectRepository(Indicator)
    private readonly indicatorRepository: Repository<Indicator>,
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    private readonly commandBus: CommandBus,
    private readonly config: ConfigService,
    private readonly client: MessagingService,
  ) {}

  async execute(command: SyncAllManifestsCommand): Promise<any> {
    //Manifests
    let date: any = new Date();
    date.setFullYear(date.getFullYear() - 1);
    date = new Date(date).toISOString().slice(0, 10);
    if (command.manifet.date) date = command.manifet.date;
    try {
      const manifests = await this.manifestRepository
        .createQueryBuilder('s')
        .where(
          "CONVERT(VARCHAR, docket) in ('CRS', 'HTS', 'MNCH', 'NDWH', 'PREP', 'MPI')",
        )
        .andWhere('logDate  > :date', { date: date })
        .orderBy({
          's.statusDate': 'DESC',
        })
        .getMany();

      if (manifests) {
        for (const m of manifests) {
          try {
            const manifestResult = await this.client.publish(
              JSON.stringify(m),
              this.config.QueueStatsExchange,
              this.config.getRoute(Manifest.name.toLowerCase()),
            );
            Logger.log(`HYDRATED MANIFESTS +++ ${m.facilityCode} +++`);

            if (manifestResult) {
              await this.commandBus.execute(
                new UpdateStatusCommand(m.id, Manifest.name, 'SENT'),
              );
            } else {
              await this.commandBus.execute(
                new UpdateStatusCommand(
                  m.id,
                  Manifest.name,
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
        }
      }
      return manifests;
    } catch (err) {
      Logger.error(err);
    }
    return;
  }
}
