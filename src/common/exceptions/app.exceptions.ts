import { BadRequestException } from '@nestjs/common';

export class AppException extends BadRequestException {
  constructor( public notification_code: number, message: string) {
    super({  notification_code ,message });
  }
}