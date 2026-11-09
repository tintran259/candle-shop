import { Body, Controller, Get, Module, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsDto } from './settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  save(@Body() body: SettingsDto) {
    return this.settings.save(body);
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
