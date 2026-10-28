import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DarajaProvider } from './daraja.provider';
import { normalizeKenyanPhone } from './phone';

interface InitiatePaymentInput {
  tenant: string;
  packageId: string;
  siteId?: string;
  phone: string;
  idempotencyKey: string;
}

interface DarajaCallback {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: Array<{ Name?: string; Value?: string | number }> };
    };
  };
}

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private worker?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(private readonly prisma: PrismaService, private readonly daraja: DarajaProvider) {}

  onModuleInit(): void {
    this.worker = setInterval(() => void this.processPaymentReconciliation(), 5_000);
    this.worker.unref();
  }

  onModuleDestroy(): void {
    if (this.worker) clearInterval(this.worker);
  }

  async initiate(input: InitiatePaymentInput) {
    const phone = normalizeKenyanPhone(input.phone);
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: input.tenant, active: true } });
    if (!tenant) throw new NotFoundException('Network not found');
    if (input.siteId && !(await this.prisma.site.findFirst({ where: { id: input.siteId, tenantId: tenant.id, active: true } }))) {
      throw new NotFoundException('Site not found');
    }
    const internetPackage = await this.prisma.internetPackage.findFirst({
      where: {
        id: input.packageId,
        tenantId: tenant.id,
        visible: true,
        OR: [{ siteId: null }, ...(input.siteId ? [{ siteId: input.siteId }] : [])],
      },
    });
    if (!internetPackage) throw new NotFoundException('Package not found');
    if (internetPackage.priceMinor % 100 !== 0) {
      throw new BadRequestException('Package price must be an exact whole KES amount for M-Pesa STK');
    }
    const priorOrder = await this.prisma.paymentOrder.findUnique({
      where: { tenantId_idempotencyKey: { tenantId: tenant.id, idempotencyKey: input.idempotencyKey } },
    });
    if (priorOrder) {
      if (priorOrder.phone !== phone || priorOrder.packageId !== internetPackage.id || priorOrder.siteId !== (input.siteId ?? null)) {
        throw new ConflictException('Idempotency key was already used for a different purchase');
      }
      return { orderId: priorOrder.id, status: priorOrder.status };
    }

    const customer = await this.prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone } },
      create: { tenantId: tenant.id, siteId: input.siteId, phone },
      update: input.siteId ? { siteId: input.siteId } : {},
    });
    const order = await this.prisma.paymentOrder.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        packageId: internetPackage.id,
        siteId: input.siteId,
        amountMinor: internetPackage.priceMinor,
        currency: internetPackage.currency,
        packageSnapshot: {
          name: internetPackage.name,
          durationSeconds: internetPackage.durationSeconds,
          downloadKbps: internetPackage.downloadKbps,
          uploadKbps: internetPackage.uploadKbps,
          deviceLimit: internetPackage.deviceLimit,
        },
        phone,
        idempotencyKey: input.idempotencyKey,
      },
    });

    try {
      const request = await this.daraja.initiate({
        phone,
        amount: Math.ceil(order.amountMinor / 100),
        accountReference: process.env.MPESA_ACCOUNT_REFERENCE ?? 'HiveNet',
        description: process.env.MPESA_TRANSACTION_DESC ?? 'Internet access',
      });
      const updated = await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { merchantRequestId: request.merchantRequestId, checkoutRequestId: request.checkoutRequestId, status: PaymentStatus.PENDING },
      });
      return { orderId: updated.id, status: updated.status };
    } catch (error) {
      // The provider may have accepted a request even if the response timed out; keep the order recoverable.
      throw error;
    }
  }

  async receiveCallback(body: DarajaCallback): Promise<{ ResultCode: number; ResultDesc: string }> {
    const callback = body.Body?.stkCallback;
    const checkoutRequestId = callback?.CheckoutRequestID;
    if (!checkoutRequestId || typeof callback.ResultCode !== 'number') throw new BadRequestException('Invalid payment callback');
    const order = await this.prisma.paymentOrder.findUnique({ where: { checkoutRequestId } });
    if (!order) throw new NotFoundException('Payment order not found');
    if (!callback.MerchantRequestID || callback.MerchantRequestID !== order.merchantRequestId) {
      throw new BadRequestException('Payment callback did not match the merchant request');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentCallback.upsert({
        where: { checkoutRequestId },
        create: { orderId: order.id, checkoutRequestId, body: body as Prisma.InputJsonValue },
        update: {},
      });
      await tx.outboxEvent.upsert({
        where: { dedupeKey: `reconcile:${checkoutRequestId}` },
        create: {
          orderId: order.id,
          dedupeKey: `reconcile:${checkoutRequestId}`,
          type: 'payment.reconcile',
          payload: { checkoutRequestId },
        },
        update: {},
      });
    });
    return { ResultCode: 0, ResultDesc: 'Accepted for reconciliation' };
  }

  async status(orderId: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true, status: true, amountMinor: true, currency: true, createdAt: true,
        entitlement: { select: { status: true, startsAt: true, expiresAt: true } },
      },
    });
    if (!order) throw new NotFoundException('Payment order not found');
    return order;
  }

  private async processPaymentReconciliation(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { processedAt: null, type: 'payment.reconcile', attempts: { lt: 12 }, nextAttemptAt: { lte: new Date() } },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
      for (const event of events) await this.reconcileEvent(event.id, event.attempts, event.payload as { checkoutRequestId: string });
    } catch (error) {
      this.logger.error('Payment reconciliation worker failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.isProcessing = false;
    }
  }

  private async reconcileEvent(eventId: string, attempts: number, payload: { checkoutRequestId: string }): Promise<void> {
    const { checkoutRequestId } = payload;
    try {
      const query = await this.daraja.query(checkoutRequestId);
      const callback = await this.prisma.paymentCallback.findUniqueOrThrow({ where: { checkoutRequestId } });
      const body = callback.body as unknown as DarajaCallback;
      const stkCallback = body.Body?.stkCallback;
      const order = await this.prisma.paymentOrder.findUniqueOrThrow({ where: { checkoutRequestId } });

      if (query.resultCode === '0' && stkCallback?.ResultCode === 0) {
        const items = stkCallback.CallbackMetadata?.Item ?? [];
        const amount = items.find((item) => item.Name === 'Amount')?.Value;
        const receipt = items.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;
        const receivedPhone = items.find((item) => item.Name === 'PhoneNumber')?.Value;
        if (Number(amount) !== Math.ceil(order.amountMinor / 100) || String(receivedPhone ?? '') !== order.phone || !receipt) {
          await this.prisma.paymentOrder.updateMany({
            where: { id: order.id, status: { not: PaymentStatus.CONFIRMED } },
            data: { status: PaymentStatus.FAILED, providerResponseCode: 'CALLBACK_MISMATCH' },
          });
          await this.markReconciled(eventId, checkoutRequestId);
          return;
        }

        await this.prisma.$transaction(async (tx) => {
          const current = await tx.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
          if (current.status !== PaymentStatus.CONFIRMED && current.status !== PaymentStatus.REVERSED) {
            await tx.paymentOrder.update({
              where: { id: order.id },
              data: { status: PaymentStatus.CONFIRMED, providerReceipt: String(receipt), providerResult: body as Prisma.InputJsonValue },
            });
            const startsAt = new Date();
            const snapshot = current.packageSnapshot as { durationSeconds: number };
            await tx.entitlement.upsert({
              where: { orderId: order.id },
              create: {
                tenantId: order.tenantId, customerId: order.customerId, siteId: order.siteId,
                orderId: order.id, status: 'PENDING_NETWORK', startsAt,
                expiresAt: new Date(startsAt.getTime() + snapshot.durationSeconds * 1_000),
              },
              update: {},
            });
            await tx.outboxEvent.upsert({
              where: { dedupeKey: `activate:${order.id}` },
              create: {
                orderId: order.id, dedupeKey: `activate:${order.id}`, type: 'network.activate',
                payload: { orderId: order.id },
              },
              update: {},
            });
          }
          await tx.paymentCallback.update({ where: { checkoutRequestId }, data: { processedAt: new Date() } });
          await tx.outboxEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
        });
        return;
      }

      if (query.resultCode !== '0' && stkCallback?.ResultCode !== undefined && stkCallback.ResultCode !== 0) {
        await this.prisma.$transaction([
          this.prisma.paymentOrder.updateMany({
            where: { id: order.id, status: { in: [PaymentStatus.PENDING, PaymentStatus.INITIATED] } },
            data: { status: PaymentStatus.FAILED, providerResponseCode: String(stkCallback.ResultCode), providerResult: body as Prisma.InputJsonValue },
          }),
          this.prisma.paymentCallback.update({ where: { checkoutRequestId }, data: { processedAt: new Date() } }),
          this.prisma.outboxEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } }),
        ]);
        return;
      }

      await this.scheduleRetry(eventId, attempts);
    } catch (error) {
      await this.scheduleRetry(eventId, attempts);
      this.logger.warn(`Payment reconciliation deferred for ${checkoutRequestId}: ${error instanceof Error ? error.message : 'unknown provider error'}`);
    }
  }

  private async scheduleRetry(eventId: string, attempts: number): Promise<void> {
    const delaySeconds = Math.min(5 * 2 ** attempts, 900);
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: { attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + delaySeconds * 1_000) },
    });
  }

  private async markReconciled(eventId: string, checkoutRequestId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.paymentCallback.update({ where: { checkoutRequestId }, data: { processedAt: new Date() } }),
      this.prisma.outboxEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } }),
    ]);
  }
}
