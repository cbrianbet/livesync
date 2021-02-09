import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { UpdateStatusCommand } from '../update-status.command';
import { Manifest } from '../../../../domain/manifest.entity';
import { Stats } from '../../../../domain/stats.entity';
import { Metric } from '../../../../domain/metric.entity';
import { Indicator } from '../../../../domain/indicator.entity';

@CommandHandler(UpdateStatusCommand)
export class UpdateStatusHandler
  implements ICommandHandler<UpdateStatusCommand> {
  constructor(
    @InjectRepository(Manifest)
    private readonly manifestRepository: Repository<Manifest>,
    @InjectRepository(Stats)
    private readonly statsRepository: Repository<Stats>,
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    @InjectRepository(Indicator)
    private readonly indicatorRepository: Repository<Indicator>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateStatusCommand): Promise<any> {
    if (command.asset === Manifest.name) {
      const result = await this.updateManifestStatus(command);
      if (result) {
        Logger.log(`${result.facilityCode} - ${result.facilityName}  SENT >>>`);
      } else {
        Logger.error(`Manifest ${command.id} NOT SENT`);
      }
    }

    if (command.asset === Stats.name) {
      const result = await this.updateStatsStatus(command);
      if (result) {
        Logger.log(`${result.facilityCode} STATS SENT >>>`);
      } else {
        Logger.error(`STATS ${command.id} NOT SENT`);
      }
    }

    if (command.asset === Metric.name) {
      const result = await this.updateMetricsStatus(command);
      if (result) {
        Logger.log(`${result.facilityCode} Metric SENT >>>`);
      } else {
        Logger.error(`Metric ${command.id} NOT SENT`);
      }
    }

    if (command.asset === Indicator.name) {
      const result = await this.updateIndicatorsStatus(command);
      if (result) {
        Logger.log(`${result.facilityCode} Indicator SENT >>>`);
      } else {
        Logger.error(`Indicator ${command.id} NOT SENT`);
      }
    }
  }

  async updateManifestStatus(command: UpdateStatusCommand): Promise<Manifest> {
    const existingManifest = await this.manifestRepository.findOne(command.id);

    if (existingManifest) {
      if (command.status === 'SENT') {
        existingManifest.markAsSent();
      }
      if (command.status === 'ERROR') {
        existingManifest.markAsFailed(command.statusInfo);
      }
      return await this.manifestRepository.save(existingManifest);
    }
  }

  async updateStatsStatus(command: UpdateStatusCommand): Promise<Stats> {
    const existingStats = await this.statsRepository.findOne(command.id);

    if (existingStats) {
      if (command.status === 'SENT') {
        existingStats.markAsSent();
      }
      if (command.status === 'ERROR') {
        existingStats.markAsFailed(command.statusInfo);
      }
      return await this.statsRepository.save(existingStats);
    }
  }

  async updateMetricsStatus(command: UpdateStatusCommand): Promise<Metric> {
    const existingMetric = await this.metricRepository.findOne(command.id);

    if (existingMetric) {
      if (command.status === 'SENT') {
        existingMetric.markAsSent();
      }
      if (command.status === 'ERROR') {
        existingMetric.markAsFailed(command.statusInfo);
      }
      return await this.metricRepository.save(existingMetric);
    }
  }

  async updateIndicatorsStatus(
    command: UpdateStatusCommand,
  ): Promise<Indicator> {
    const existingIndicator = await this.indicatorRepository.findOne(
      command.id,
    );

    if (existingIndicator) {
      if (command.status === 'SENT') {
        existingIndicator.markAsSent();
      }
      if (command.status === 'ERROR') {
        existingIndicator.markAsFailed(command.statusInfo);
      }
      return await this.indicatorRepository.save(existingIndicator);
    }
  }
}
