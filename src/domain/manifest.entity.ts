import { ManifestStagedEvent } from '../application/stage/events/manifest.staged.event';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AggregateRoot } from '@nestjs/cqrs';
import { HandshakeStagedEvent } from '../application/stage/events/handshake.staged.event';

@Entity()
export class Manifest extends AggregateRoot {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  facilityCode: number;

  @Column()
  facilityName: string;

  @Column('text')
  docket: string;

  @Column({ type: 'datetime' })
  logDate: Date;

  @Column({ type: 'datetime' })
  buildDate: Date;

  @Column({ type: 'int' })
  patientCount: number;

  @Column({ type: 'text', nullable: true })
  cargo: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  statusDate: Date;

  @Column({ type: 'text', nullable: true })
  statusInfo: string;

  @Column({ type: 'datetime', nullable: true })
  start: Date;

  @Column({ type: 'datetime', nullable: true })
  end: Date;

  @Column({ type: 'uuid', nullable: true })
  session: string;

  @Column({ type: 'text', nullable: true })
  tag: string;

  constructor() {
    super();
  }

  initialize() {
    this.status = 'STAGED';
    this.statusDate = new Date();
    this.apply(new ManifestStagedEvent(this.id));
  }

  markAsSent() {
    this.status = 'SENT';
    this.statusDate = new Date();
  }

  markAsFailed(error: string) {
    this.status = 'ERROR';
    this.statusDate = new Date();
    this.statusInfo = error;
  }

  updateSession(end: Date) {
    this.end = end;
    this.apply(new HandshakeStagedEvent(this.id));
  }
}
