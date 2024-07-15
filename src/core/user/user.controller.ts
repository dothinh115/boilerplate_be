import { Controller, Body, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TQuery } from '../utils/model.util';
import { Routing } from '../decorators/route.decorator';
import { PostRouting } from '../decorators/method/PostRouting.decorator';
import { GetRouting } from '../decorators/method/GetRouting.decorator';
import { PatchRouting } from '../decorators/method/PatchRouting.decorator';
import { DeleteRouting } from '../decorators/method/DeleteRouting.decorator';

@Routing()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @PostRouting()
  create(@Body() body: CreateUserDto, @Query() query: TQuery) {
    return this.userService.create(body, query);
  }

  @GetRouting()
  find(@Query() query: TQuery) {
    return this.userService.find(query);
  }

  @PatchRouting(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Query() query: TQuery,
  ) {
    return this.userService.update(id, body, query);
  }

  @DeleteRouting(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
