import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsDivisibleBy, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';

class CreatePackageDto {
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @IsDivisibleBy(100)
  @Min(1)
  priceMinor!: number;

  @IsOptional()
  @IsString()
  currency = 'KES';

  @Type(() => Number)
  @IsInt()
  @Min(60)
  durationSeconds!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsDivisibleBy(100)
  @Min(1)
  @Max(10_000_000)
  downloadKbps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  uploadKbps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  deviceLimit = 1;

  @IsOptional()
  @IsBoolean()
  visible = true;
}

class UpdatePackageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  durationSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  downloadKbps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  uploadKbps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  deviceLimit?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

@Controller('admin/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
export class AdminPackagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const tenantId = this.getTenantId(request);
    return this.prisma.internetPackage.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { durationSeconds: 'asc' }],
      select: {
        id: true, siteId: true, name: true, description: true, priceMinor: true, currency: true,
        durationSeconds: true, downloadKbps: true, uploadKbps: true, deviceLimit: true,
        dataLimitBytes: true, visible: true, sortOrder: true, createdAt: true, updatedAt: true,
      },
    });
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreatePackageDto) {
    const tenantId = this.getTenantId(request);
    if (body.siteId && !(await this.prisma.site.findFirst({ where: { id: body.siteId, tenantId } }))) {
      throw new NotFoundException('Site not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const internetPackage = await tx.internetPackage.create({ data: { ...body, tenantId } });
      await tx.auditLog.create({
        data: {
          tenantId, actorId: request.user?.sub, action: 'package.created',
          entityType: 'InternetPackage', entityId: internetPackage.id,
          metadata: { name: internetPackage.name, priceMinor: internetPackage.priceMinor },
        },
      });
      return internetPackage;
    });
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdatePackageDto) {
    const tenantId = this.getTenantId(request);
    const existing = await this.prisma.internetPackage.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Package not found');
    return this.prisma.$transaction(async (tx) => {
      const internetPackage = await tx.internetPackage.update({ where: { id }, data: body });
      await tx.auditLog.create({
        data: {
          tenantId, actorId: request.user?.sub, action: 'package.updated',
          entityType: 'InternetPackage', entityId: id,
          metadata: { changedFields: Object.keys(body) },
        },
      });
      return internetPackage;
    });
  }

  private getTenantId(request: AuthenticatedRequest): string {
    if (!request.user?.tenantId) throw new ForbiddenException('Tenant scope is required');
    return request.user.tenantId;
  }
}
