import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health.controller';
import { PackagesController } from './packages/packages.controller';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { DarajaProvider } from './payments/daraja.provider';
import { PrismaService } from './prisma.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { AdminPackagesController } from './packages/admin-packages.controller';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '8h' } }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [HealthController, AuthController, PackagesController, PaymentsController, DashboardController, AdminPackagesController],
  providers: [PrismaService, AuthService, JwtAuthGuard, RolesGuard, PaymentsService, DarajaProvider, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
