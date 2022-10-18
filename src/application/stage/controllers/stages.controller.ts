import { Body, Controller, Post, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { StatsDto } from '../../../domain/dto/stats.dto';
import { StageManifestCommand } from '../commands/stage-manifest.command';
import { StageStatsCommand } from '../commands/stage-stats.command';
import { StageMetricCommand } from '../commands/stage-metric.command';
import { StageIndicatorCommand } from '../commands/stage-indicator.command';
import { StageHandshakeCommand } from '../commands/stage-handshake.command';
import { SyncCommand } from '../commands/sync.command';
import { HydrateDto } from '../../../domain/dto/hydrate.dto';
import { SyncAllCommand } from '../commands/sync-all.command';
import { SyncAllManifestsCommand } from './../commands/sync-all-manifests.command';

@Controller('stages')
export class StagesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('manifest')
  async logManifest(@Body() manifest: any) {
    const cmd = new StageManifestCommand(
      manifest.id,
      manifest.facilityCode,
      manifest.facilityName,
      manifest.docket,
      manifest.logDate,
      manifest.buildDate,
      manifest.patientCount,
      manifest.cargo,
    );

    cmd.session = manifest.session;
    cmd.start = manifest.start;
    cmd.end = manifest.end;
    cmd.tag = manifest.tag;

    return this.commandBus.execute(cmd);
  }

  @Post('stats')
  async postStats(@Body() statsDto: StatsDto) {
    return this.commandBus.execute(
      new StageStatsCommand(
        statsDto.facilityCode,
        statsDto.docket,
        statsDto.stats,
        statsDto.updated,
        statsDto.manifestId,
      ),
    );
  }

  @Post('metric')
  async logMetric(@Body() metrics: any[]) {
    await this.commandBus.execute(new StageMetricCommand(metrics));
  }

  @Post('indicator')
  async logIndicator(@Body() indicators: any[]) {
    await this.commandBus.execute(new StageIndicatorCommand(indicators));
  }

  @Post('handshake')
  async logHandshake(@Body() handshakes: any) {
    return this.commandBus.execute(new StageHandshakeCommand(handshakes));
  }

  @Post('hydrate')
  async syncStats(@Body() hydrateDto: HydrateDto) {
    for (const code of hydrateDto.codes) {
      try {
        await this.commandBus.execute(
          new SyncCommand({
            facilityCode: code,
            docket: hydrateDto.docket,
          }),
        );
      } catch (error) {
        Logger.error(error);
      }
    }
    return hydrateDto;
  }

  @Post('hydrateAll')
  async hydrateAll(@Body() hydrateDto: HydrateDto) {
    try {
      await this.commandBus.execute(
        new SyncAllCommand({
          facilityCode: 0,
          docket: '',
        }),
      );
    } catch (error) {
      Logger.error(error);
    }
    return hydrateDto;
  }

  @Post('hydrateAllManifests')
  async hydrateAllManifests(@Body() hydrateDto: HydrateDto) {
    try {
      await this.commandBus.execute(
        new SyncAllManifestsCommand({
          date: hydrateDto.date,
        }),
      );
    } catch (error) {
      Logger.error(error);
    }
    return hydrateDto;
  }
}
