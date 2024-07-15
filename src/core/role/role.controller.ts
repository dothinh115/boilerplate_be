import { Controller, Get, Body, Param, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { TQuery } from '../utils/model.util';
import { Routing } from '../decorators/route.decorator';
import { PostRouting } from '../decorators/method/PostRouting.decorator';
import { PatchRouting } from '../decorators/method/PatchRouting.decorator';
import { DeleteRouting } from '../decorators/method/DeleteRouting.decorator';

@Routing()
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @PostRouting()
  create(@Body() body: CreateRoleDto, @Query() query: TQuery) {
    return this.roleService.create(body, query);
  }

  @Get()
  find(@Query() query: TQuery) {
    return this.roleService.find(query);
  }

  @PatchRouting(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @Query() query: TQuery,
  ) {
    return this.roleService.update(+id, body, query);
  }

  @DeleteRouting(':id')
  async remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
