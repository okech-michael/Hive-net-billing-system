import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_OWNER, UserRole.TENANT_ADMIN, UserRole.NETWORK_OPERATOR, UserRole.FINANCE_OPERATOR, UserRole.REPORT_VIEWER)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async overview(@Req() request: AuthenticatedRequest) {
    const tenantId = request.user?.tenantId;
    if (!tenantId && request.user?.role !== 'PLATFORM_OWNER') return { activeSessions: 0, pendingPayments: 0, confirmedTodayMinor: 0, customers: 0 };
    const where = tenantId ? { tenantId } : {};
    const nairobiNow = new Date(Date.now() + 3 * 60 * 60 * 1_000);
    const startOfDay = new Date(Date.UTC(nairobiNow.getUTCFullYear(), nairobiNow.getUTCMonth(), nairobiNow.getUTCDate()) - 3 * 60 * 60 * 1_000);
    const [activeSessions, pendingPayments, customers] = await Promise.all([
      this.prisma.networkSession.count({ where: { ...where, status: 'AUTHORIZED' } }),
      this.prisma.paymentOrder.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.customer.count({ where }),
    ]);
    const overview = { activeSessions, pendingPayments, customers };
    const financialRoles: UserRole[] = [UserRole.PLATFORM_OWNER, UserRole.TENANT_ADMIN, UserRole.FINANCE_OPERATOR, UserRole.REPORT_VIEWER];
    if (!request.user || !financialRoles.includes(request.user.role as UserRole)) {
      return overview;
    }
    const revenue = await this.prisma.paymentOrder.aggregate({
      where: { ...where, status: 'CONFIRMED', updatedAt: { gte: startOfDay } },
      _sum: { amountMinor: true },
    });
    return { ...overview, confirmedTodayMinor: revenue._sum.amountMinor ?? 0 };
  }
}
