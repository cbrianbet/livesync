import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection, RabbitSubscribe } from '@nestjs-plus/rabbitmq';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly config: ConfigService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  public async publish(
    message: any,
    exchange: string,
    route: string,
  ): Promise<boolean> {
    try {
      await this.amqpConnection.publish(exchange, route, message);
      return true;
    } catch (e) {
      return false;
    }
  }

  @RabbitSubscribe({
    exchange: 'stats.exchange',
    routingKey: 'syncstats.route',
    queue: 'syncstats.queue',
  })
  public async subscribeToGlobe(data: any) {
    const message = JSON.parse(data);
    Logger.log(`+++++++++++ ${message.label} +++++++++`);
    Logger.log(`request ${message.body.code}`);
  }
}
