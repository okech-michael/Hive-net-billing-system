import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { PaymentsService } from './payments.service';

class InitiatePaymentDto {
  @IsString()
  @Length(2, 80)
  tenant!: string;

  @IsUUID()
  packageId!: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsString()
  @Matches(/^[+()\d\s-]{9,18}$/)
  phone!: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('mpesa/stk')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  initiate(@Body() body: InitiatePaymentDto, @Headers('idempotency-key') key?: string) {
    if (!key || key.length < 16 || key.length > 128) {
      throw new BadRequestException('A valid Idempotency-Key header is required');
    }
    return this.payments.initiate({ ...body, idempotencyKey: key });
  }

  @Post('mpesa/callback')
  callback(@Body() body: Record<string, unknown>) {
    return this.payments.receiveCallback(body);
  }

  @Get(':orderId')
  status(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.payments.status(orderId);
  }
}
