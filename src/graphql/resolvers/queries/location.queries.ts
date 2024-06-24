import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Area } from 'src/graphql/models/db/area';
import { AuthGuard } from 'src/guards/admin.guard';
import { AreaService } from 'src/services/db/area.service';
import { AreaType } from 'src/types/smart_g4';

@Resolver()
export class LocationQueries {
  constructor(
    private readonly locationService: AreaService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async Properties() {
    return await this.locationService.listArea(AreaType.PROPERTY, undefined, { inclSubArea: true });
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async PropertyLevels(@Args({ name: 'PropertyId', type: () => Int }) propertyId: number) {
    return await this.locationService.listArea(AreaType.LEVEL, propertyId, { inclSubArea: true });
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async LevelUnits(@Args({ name: 'LevelId', type: () => Int }) levelId: number) {
    return await this.locationService.listArea(AreaType.UNIT, levelId, { inclDevices: true });
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async AreaByKeyword(@Args('filter') filter: string) {
    return await this.locationService.byKeyword(filter);
  }
}
