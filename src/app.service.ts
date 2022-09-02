import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      name: 'Dwapi LiveSync Staging',
      build: 'v02SEP220935',
      staus: 'running',
    };
  }
}
