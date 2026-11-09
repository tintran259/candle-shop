// Đơn hàng (docs/pages/orders.md, docs/workflow.md). Mọi thao tác trả đơn sau khi đổi, đúng dạng Order của BO
import { Body, Controller, Get, HttpCode, Module, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsModule } from '../settings/settings.module.js';
import { CancelDto, ComplaintDto, CreateOrderDto, EditOrderDto, NoteDto, OrderQuery, ReasonDto, RefundDto, ResendDto, ReturnDto, ScheduleDto, ShipDto } from './orders.dto.js';
import { OrderAfterService } from './order-after.service.js';
import { OrderEditService } from './order-edit.service.js';
import { OrderFlowService } from './order-flow.service.js';
import { OrdersService } from './orders.service.js';
import { heldNeeds } from './order-stock.js';

const by = (req: AuthedRequest) => req.session?.name ?? 'Admin';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly editor: OrderEditService,
    private readonly flow: OrderFlowService,
    private readonly after: OrderAfterService,
  ) {}

  @Get()
  list(@Query() q: OrderQuery) {
    return this.orders.list(q.status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Post()
  create(@Body() body: CreateOrderDto, @Req() req: AuthedRequest) {
    return this.orders.create(body, by(req));
  }

  @Put(':id')
  edit(@Param('id') id: string, @Body() body: EditOrderDto, @Req() req: AuthedRequest) {
    return this.editor.edit(id, body, by(req));
  }

  @Post(':id/advance')
  @HttpCode(200)
  advance(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.flow.advance(id, by(req));
  }

  @Post(':id/ship')
  @HttpCode(200)
  ship(@Param('id') id: string, @Body() body: ShipDto, @Req() req: AuthedRequest) {
    return this.flow.ship(id, body, by(req));
  }

  @Put(':id/shipment')
  updateShipment(@Param('id') id: string, @Body() body: ShipDto, @Req() req: AuthedRequest) {
    return this.flow.updateShipment(id, body, by(req));
  }

  @Post(':id/delivery-failed')
  @HttpCode(200)
  failDelivery(@Param('id') id: string, @Body() body: ReasonDto, @Req() req: AuthedRequest) {
    return this.flow.failDelivery(id, body.reason, by(req));
  }

  @Post(':id/redeliver')
  @HttpCode(200)
  redeliver(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.flow.redeliver(id, by(req));
  }

  @Post(':id/return')
  @HttpCode(200)
  startReturn(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.flow.startReturn(id, by(req));
  }

  @Post(':id/receive-return')
  @HttpCode(200)
  receiveReturn(@Param('id') id: string, @Body() body: ReturnDto, @Req() req: AuthedRequest) {
    return this.flow.receiveReturn(id, body, by(req));
  }

  @Post(':id/resend')
  @HttpCode(200)
  resend(@Param('id') id: string, @Body() body: ResendDto, @Req() req: AuthedRequest) {
    return this.flow.resend(id, body, by(req));
  }

  @Patch(':id/ready-date')
  reschedule(@Param('id') id: string, @Body() body: ScheduleDto, @Req() req: AuthedRequest) {
    return this.flow.reschedule(id, body.readyDate, by(req));
  }

  @Patch(':id/internal-note')
  setInternalNote(@Param('id') id: string, @Body() body: NoteDto, @Req() req: AuthedRequest) {
    return this.flow.setInternalNote(id, body.internalNote, by(req));
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @Body() body: CancelDto, @Req() req: AuthedRequest) {
    return this.after.cancel(id, body, by(req));
  }

  @Post(':id/refund')
  @HttpCode(200)
  recordRefund(@Param('id') id: string, @Body() body: RefundDto, @Req() req: AuthedRequest) {
    return this.after.recordRefund(id, body, by(req));
  }

  @Post(':id/refund-overpaid')
  @HttpCode(200)
  refundPart(@Param('id') id: string, @Body() body: RefundDto, @Req() req: AuthedRequest) {
    return this.after.refundPart(id, body, by(req));
  }

  @Post(':id/complaints')
  complain(@Param('id') id: string, @Body() body: ComplaintDto, @Req() req: AuthedRequest) {
    return this.after.complain(id, body, by(req));
  }
}

// Nguyên liệu đang giữ cho các đơn Đã thanh toán: { materialId: lượng }. Tồn dùng được = tồn − đang giữ
@ApiTags('orders')
@ApiBearerAuth()
@Controller('admin/stock-holds')
export class StockHoldsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return Object.fromEntries(await heldNeeds(this.prisma));
  }
}

@Module({ imports: [SettingsModule], controllers: [OrdersController, StockHoldsController], providers: [OrdersService, OrderEditService, OrderFlowService, OrderAfterService] })
export class OrdersModule {}
