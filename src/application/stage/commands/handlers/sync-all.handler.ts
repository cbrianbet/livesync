import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { SyncAllCommand } from '../sync-all.command';
import { InjectRepository } from '@nestjs/typeorm';
import { Stats } from '../../../../domain/stats.entity';
import { Like, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UpdateStatusCommand } from '../update-status.command';
import { ConfigService } from '../../../../config/config.service';
import { MessagingService } from '../../../../infrastructure/messging/messaging.service';
import { Manifest } from '../../../../domain/manifest.entity';
import { Indicator } from '../../../../domain/indicator.entity';
import { Metric } from './../../../../domain/metric.entity';

@CommandHandler(SyncAllCommand)
export class SyncAllHandler implements ICommandHandler<SyncAllCommand> {
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

  async execute(command: SyncAllCommand): Promise<any> {
    let facilities = await this.manifestRepository
      .createQueryBuilder('s')
      .select('distinct (facilityCode) facilityCode')
      .getRawMany();

    //Manifests
    let dockets = ['CRS','HTS','MNCH','MPI','NDWH','PREP']
    for (const docket of dockets) {
      facilities.forEach(async facility => {
        try {
          const manifests = await this.manifestRepository
            .createQueryBuilder('s')
            .where('s.facilityCode = :facilityCode', {
              facilityCode: facility.facilityCode,
            })
            .andWhere('s.docket like :docket', {
              docket: '%' + docket + '%',
            })
            .orderBy({
              's.statusDate': 'DESC',
            })
            .getOne();

          if (manifests) {
            try {
              const manifestResult = await this.client.publish(
                JSON.stringify(manifests),
                this.config.QueueStatsExchange,
                this.config.getRoute(Manifest.name.toLowerCase()),
              );
              Logger.log(
                `HYDRATED MANIFESTS ==== ${facility.facilityCode}`,
              );

              if (manifestResult) {
                await this.commandBus.execute(
                  new UpdateStatusCommand(
                    manifests.id,
                    Manifest.name,
                    'SENT',
                  ),
                );
              } else {
                await this.commandBus.execute(
                  new UpdateStatusCommand(
                    manifests.id,
                    Manifest.name,
                    'ERROR',
                    'Unkown publish Error',
                  ),
                );
              }
            } catch (e) {
              Logger.error(e);
              await this.commandBus.execute(
                new UpdateStatusCommand(manifests.id, Stats.name, 'ERROR', e),
              );
            }
            // });
          }
        } catch (err) {
          Logger.error(err);
        }
      });
    }
    //metrics
    facilities.forEach(async facility => {
      try {
        const metrics = await this.metricRepository
          .createQueryBuilder('s')
          .where('facilityCode = :facilityCode', {
            facilityCode: facility.facilityCode,
          })
          .andWhere(
            'facilityManifestId IN (SELECT max([facilityManifestId]) FROM [metric] GROUP BY facilityCode  ) ',
          )
          .orderBy({
            'statusDate': 'DESC',
          })
          .getMany();

        if (metrics) {
          for (const metric of metrics) {
            try {
              const result = await this.client.publish(
                JSON.stringify(metric),
                this.config.QueueStatsExchange,
                this.config.getRoute(Metric.name.toLowerCase()),
              );
              Logger.log(metric)

              if (result) {
                await this.commandBus.execute(
                  new UpdateStatusCommand(metric.id, Metric.name, 'SENT'),
                );
              } else {
                await this.commandBus.execute(
                  new UpdateStatusCommand(
                    metric.id,
                    Metric.name,
                    'ERROR',
                    'Unkown Publish Error',
                  ),
                );
              }
            } catch (e) {
              Logger.error(`PUBLISH`, e);
              await this.commandBus.execute(
                new UpdateStatusCommand(metric.id, Metric.name, 'ERROR', e),
              );
            }
          }
        }
      } catch (err) {
        Logger.error(err);
      }
    });
    
    //indicators
    const indicatorsCollected = [
      'EMR_ETL_Refresh',
      'HTS_INDEX',
      'HTS_INDEX_POS',
      'HTS_LINKED',
      'HTS_TESTED',
      'HTS_TESTED_POS',
      'LAST_ENCOUNTER_CREATE_DATE',
      'MFL_CODE',
      'MMD',
      'RETENTION_ON_ART_12_MONTHS',
      'RETENTION_ON_ART_VL_1000_12_MONTHS',
      'TX_CURR',
      'TX_ML',
      'TX_NEW',
      'TX_PVLS',
      'TX_RTT',
    ];
    const stages = ['EMR', 'DWH'];

    facilities.forEach(async facility => {
      try {
        indicatorsCollected.forEach(async i => {
          stages.forEach(async stage => {
            const indicators = await this.indicatorRepository
              .createQueryBuilder('s')
              .where('s.facilityCode = :facilityCode', {
                facilityCode: facility.facilityCode,
              })
              .andWhere("name like :indicatorName",{
                indicatorName: i
              })
              .andWhere("stage like :stage",{
                stage: stage
              })
              .orderBy({
                's.indicatorDate': 'DESC',
              })
              .getOne();

            if (indicators) {
              try {
                const result = await this.client.publish(
                  JSON.stringify(indicators),
                  this.config.QueueStatsExchange,
                  this.config.getRoute(Indicator.name.toLowerCase()),
                );

Logger.log(indicators)
                if (result) {
                  await this.commandBus.execute(
                    new UpdateStatusCommand(
                      indicators.id,
                      Indicator.name,
                      'SENT',
                    ),
                  );
                } else {
                  await this.commandBus.execute(
                    new UpdateStatusCommand(
                      indicators.id,
                      Indicator.name,
                      'ERROR',
                      'Unkown Publish Error',
                    ),
                  );
                }
              } catch (e) {
                Logger.error(e);
                await this.commandBus.execute(
                  new UpdateStatusCommand(
                    indicators.id,
                    Indicator.name,
                    'ERROR',
                    e,
                  ),
                );
              }
            }
          });
        });
      } catch (err) {
        Logger.error(err);
      }
    })

    //stats
    facilities.forEach(async facility => {
      try {
        let dockets = ['CRS','HTS','MNCH','MPI','NDWH','PREP']
        for (const docket of dockets) {
            const stats = await this.repository
              .createQueryBuilder('s')
              .where('s.facilityCode = :facilityCode', {
                facilityCode: facility.facilityCode,
              })
              .andWhere('s.docket like :docket', {
                docket: '%' + docket + '%',
              })
              .orderBy({
                's.updated': 'DESC',
              })
              .getOne();
            Logger.log(stats);

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
        }
      } catch (err) {
        Logger.error(err);
      }
    })
    return;
  }
}
