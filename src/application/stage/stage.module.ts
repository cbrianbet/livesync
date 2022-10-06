import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StageManifestHandler } from './commands/handlers/stage-manifest.handler';
import { StageStatsHandler } from './commands/handlers/stage-stats.handler';
import { SyncHandler } from './commands/handlers/sync.handler';
import { CqrsModule } from '@nestjs/cqrs';
import { StagesController } from './controllers/stages.controller';
import { Manifest } from '../../domain/manifest.entity';
import { Stats } from '../../domain/stats.entity';
import { UpdateStatusHandler } from './commands/handlers/update-status.handler';
import { ManifestStagedHandler } from './events/handlers/manifest.staged.handler';
import { StatsStagedHanlder } from './events/handlers/stats.staged.hanlder';
import { GetManifestHandler } from './queries/handlers/get-manifest.handler';
import { GetStatsHandler } from './queries/handlers/get-stats.handler';
import { MessagingModule } from '../../infrastructure/messging/messaging.module';
import { ConfigModule } from '../../config/config.module';
import { MessagingService } from '../../infrastructure/messging/messaging.service';
import { StageMetricHandler } from './commands/handlers/stage-metric.handler';
import { Metric } from '../../domain/metric.entity';
import { MetricStagedHandler } from './events/handlers/metric.staged.handler';
import { GetMetricHandler } from './queries/handlers/get-metric.handler';
import { StageIndicatorHandler } from './commands/handlers/stage-indicator.handler';
import { Indicator } from '../../domain/indicator.entity';
import { IndicatorStagedHandler } from './events/handlers/indicator.staged.handler';
import { GetIndicatorHandler } from './queries/handlers/get-indicator.handler';
import { HandshakeStagedHandler } from './events/handlers/handshake.staged.handler';
import { StageHandshakeHandler } from './commands/handlers/stage-handshake.handler';
import { SyncAllManifestsHandler } from './commands/handlers/sync-all-manifests.handler';

@Module({
  imports: [
  MessagingModule,
    ConfigModule,
    CqrsModule,
    TypeOrmModule.forFeature([Manifest, Stats, Metric, Indicator]),
  ],
  // @ts-ignore
  providers: [
    StageManifestHandler,
    StageStatsHandler,
    StageMetricHandler,
    StageIndicatorHandler,
    StageHandshakeHandler,
    SyncHandler,
    UpdateStatusHandler,
    ManifestStagedHandler,
    StatsStagedHanlder,
    MetricStagedHandler,
    IndicatorStagedHandler,
    HandshakeStagedHandler,
    GetManifestHandler,
    GetStatsHandler,
    GetMetricHandler,
    GetIndicatorHandler,
    MessagingService,
    SyncAllManifestsHandler
  ],
  controllers: [StagesController],
})
export class StageModule {}
