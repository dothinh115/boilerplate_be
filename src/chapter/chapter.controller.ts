import { Controller, Body, Param, Query } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { TQuery } from 'src/core/utils/model.util';
import { Routing } from 'src/core/decorators/route.decorator';
import { PostRouting } from 'src/core/decorators/method/PostRouting.decorator';
import { GetRouting } from 'src/core/decorators/method/GetRouting.decorator';
import { PatchRouting } from 'src/core/decorators/method/PatchRouting.decorator';
import { DeleteRouting } from 'src/core/decorators/method/DeleteRouting.decorator';

@Routing()
@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @PostRouting()
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.chapterService.create(createChapterDto);
  }

  @GetRouting()
  find(@Query() query: TQuery) {
    return this.chapterService.find(query);
  }

  @PatchRouting(':id')
  update(@Param('id') id: string, @Body() updateChapterDto: UpdateChapterDto) {
    return this.chapterService.update(+id, updateChapterDto);
  }

  @DeleteRouting(':id')
  remove(@Param('id') id: string) {
    return this.chapterService.remove(+id);
  }
}
