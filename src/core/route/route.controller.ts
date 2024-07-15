import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { RouteService } from './route.service';
import { TQuery } from '../utils/model.util';
import { Routing } from '../decorators/route.decorator';
import { PatchRouting } from '../decorators/method/PatchRouting.decorator';
import { UpdateRouteDto } from './dto/route-update.dto';

@Routing()
@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  find(@Query() query: TQuery) {
    return this.routeService.find(query);
  }

  @PatchRouting(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateRouteDto,
    @Query() query: TQuery,
  ) {
    return this.routeService.update(+id, body, query);
  }
}
