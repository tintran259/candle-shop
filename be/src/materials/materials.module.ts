// Kho nguyên liệu và phiếu kho (docs/pages/inventory.md, docs/pages/stock-movements.md)
import { Body, Controller, Delete, Get, HttpCode, Module, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { CostDto, CreateManyDto, CreateMaterialDto, MovementDto, MovementQuery, ProduceDto, UpdateMaterialDto } from './materials.dto.js';
import { MaterialsService } from './materials.service.js';
import { StockService } from './stock.service.js';

// Người ghi phiếu: tên trong phiên đăng nhập
const by = (req: AuthedRequest) => req.session?.name ?? 'Admin';

@ApiTags('materials')
@ApiBearerAuth()
@Controller('admin/materials')
export class MaterialsController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly stock: StockService,
  ) {}

  @Get()
  list() {
    return this.materials.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.materials.get(id);
  }

  @Post()
  create(@Body() body: CreateMaterialDto, @Req() req: AuthedRequest) {
    return this.materials.create(body, by(req));
  }

  @Post('batch')
  createMany(@Body() body: CreateManyDto, @Req() req: AuthedRequest) {
    return this.materials.createMany(body.materials, by(req));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateMaterialDto) {
    return this.materials.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.materials.remove(id);
  }

  @Post(':id/movements')
  move(@Param('id') id: string, @Body() body: MovementDto, @Req() req: AuthedRequest) {
    return this.stock.move(id, body, by(req));
  }

  @Put(':id/cost')
  @HttpCode(200)
  setCost(@Param('id') id: string, @Body() body: CostDto, @Req() req: AuthedRequest) {
    return this.stock.setCost(id, body, by(req));
  }

  @Post(':id/produce')
  produce(@Param('id') id: string, @Body() body: ProduceDto, @Req() req: AuthedRequest) {
    return this.stock.produce(id, body, by(req));
  }
}

@ApiTags('materials')
@ApiBearerAuth()
@Controller('admin/stock-movements')
export class StockMovementsController {
  constructor(private readonly stock: StockService) {}

  @Get()
  list(@Query() query: MovementQuery) {
    return this.stock.movements(query);
  }
}

@Module({ controllers: [MaterialsController, StockMovementsController], providers: [MaterialsService, StockService], exports: [MaterialsService, StockService] })
export class MaterialsModule {}
