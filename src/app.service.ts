import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

@Injectable()
export class AppService {
  getHello(): object {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const env = process.env.NODE_ENV || 'local';

    return {
      status: 'success',
      data: { message: 'Ngopi aja JULU!!' },
      ...(env !== 'production' && { env }),
      meta: { timestamp: dayjs().tz('Asia/Jakarta').format() },
    };
  }
}
