import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { TQuery } from '../utils/model.util';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  find(@Query() query: TQuery) {
    return this.settingService.find(query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Query() query: TQuery,
  ) {
    return this.settingService.update(id, updateSettingDto, query);
  }
}
