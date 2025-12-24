import { SetMetadata } from '@nestjs/common';

export const MESSAGE_CODE_KEY = 'message_code';

export const MessageCode = (code: number) => SetMetadata(MESSAGE_CODE_KEY, code);