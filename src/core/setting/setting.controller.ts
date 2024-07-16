import { Controller, Body, Param, Query } from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { TQuery } from '../utils/model.util';
import { GetRouting } from '../decorators/method/GetRouting.decorator';
import { PatchRouting } from '../decorators/method/PatchRouting.decorator';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @GetRouting()
  find(@Query() query: TQuery) {
    return this.settingService.find(query);
  }

  @PatchRouting(':id')
  update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Query() query: TQuery,
  ) {
    return this.settingService.update(id, updateSettingDto, query);
  }
}
