import {
  CommandBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ManifestStagedEvent } from '../manifest.staged.event';
import { UpdateStatusCommand } from '../../commands/update-status.command';
import { GetManifestQuery } from '../../queries/get-manifest-query';
import { Manifest } from '../../../../domain/manifest.entity';
import { MessagingService } from '../../../../infrastructure/messging/messaging.service';
import { ConfigService } from '../../../../config/config.service';
import { HandshakeStagedEvent } from '../handshake.staged.event';

@EventsHandler(HandshakeStagedEvent)
export class HandshakeStagedHandler
  implements IEventHandler<HandshakeStagedEvent> {
  constructor(
    private readonly config: ConfigService,
    private readonly client: MessagingService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: HandshakeStagedEvent) {
    let manifests = [];
    Logger.debug(`=== Publishing HandshakeStagedEvent ===:${event.id}`);

    manifests = await this.queryBus.execute<GetManifestQuery, Manifest[]>(
      new GetManifestQuery({ id: event.id }),
    );

    for (const manifest of manifests) {
      try {
        const result = await this.client.publish(
          JSON.stringify(manifest),
          this.config.QueueStatsExchange,
          this.config.getRoute('handshake'),
        );

        if (result) {
          // await this.commandBus.execute(
          //   new UpdateStatusCommand(manifest.id, Manifest.name, 'SENT'),
          // );
        } else {
          await this.commandBus.execute(
            new UpdateStatusCommand(
              manifest.id,
              Manifest.name,
              'ERROR',
              'Unkown Publish Error',
            ),
          );
        }
      } catch (e) {
        Logger.error(`PUBLISH`, e);
        await this.commandBus.execute(
          new UpdateStatusCommand(manifest.id, Manifest.name, 'ERROR', e),
        );
      }
    }
  }
}
