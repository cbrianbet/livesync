import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      name: 'Dwapi LiveSync',
      build: 'v09FEB211704',
      staus: 'running',
    };
  }
}
