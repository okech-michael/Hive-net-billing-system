import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PrismaService } from '../prisma.service';

class PackageQuery {
  @IsString()
  tenant!: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;
}

@Controller('packages')
export class PackagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: PackageQuery) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: query.tenant, active: true } });
    if (!tenant) throw new NotFoundException('Network not found');
    if (query.siteId && !(await this.prisma.site.findFirst({ where: { id: query.siteId, tenantId: tenant.id, active: true } }))) {
      throw new NotFoundException('Site not found');
    }
    return this.prisma.internetPackage.findMany({
      where: {
        tenantId: tenant.id,
        visible: true,
        OR: [{ siteId: null }, ...(query.siteId ? [{ siteId: query.siteId }] : [])],
      },
      orderBy: [{ sortOrder: 'asc' }, { durationSeconds: 'asc' }],
      select: {
        id: true, name: true, description: true, priceMinor: true, currency: true,
        durationSeconds: true, downloadKbps: true, uploadKbps: true, deviceLimit: true,
      },
    });
  }
}
