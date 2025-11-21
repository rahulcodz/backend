import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Backend API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
