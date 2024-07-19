import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Area } from 'src/graphql/models/db/area';
import { AuthGuard } from 'src/guards/admin.guard';
import { AreaService } from 'src/services/db/area.service';
import { AreaType } from 'src/types/smart_g4';

@Resolver()
export class LocationQueries {
  constructor(private readonly locationService: AreaService) {}

  @UseGuards(AuthGuard)
  @Query(() => Area)
  async ById(@Args({ name: 'AreaId', type: () => Int }) areaId: number) {
    const result = await this.locationService.byId(areaId, {
      inclDevices: true,
    });

    return {
      ...result,
      DeviceCount:
        result.Type === 'Property'
          ? await this.locationService.propertyDeviceCount(result.Id)
          : result.Type === 'Level'
            ? await this.locationService.levelDeviceCount(result.Id)
            : await this.locationService.unitDeviceCount(result.Id),
    };
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async Properties(): Promise<Area[]> {
    const result = await this.locationService.listArea(
      AreaType.PROPERTY,
      undefined,
      { inclSubArea: true },
    );

    const withCount: Area[] = [];
    for (let i = 0; i < result.length; i++) {
      withCount.push({
        ...result[i],
        DeviceCount: await this.locationService.propertyDeviceCount(
          result[i].Id,
        ),
      });
    }

    return withCount;
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async PropertyLevels(
    @Args({ name: 'PropertyId', type: () => Int }) propertyId: number,
  ) {
    const result = await this.locationService.listArea(
      AreaType.LEVEL,
      propertyId,
      { inclSubArea: true },
    );

    const withCount: Area[] = [];
    for (let i = 0; i < result.length; i++) {
      withCount.push({
        ...result[i],
        DeviceCount: await this.locationService.levelDeviceCount(result[i].Id),
      });
    }

    return withCount;
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async LevelUnits(
    @Args({ name: 'LevelId', type: () => Int }) levelId: number,
  ) {
    const result = await this.locationService.listArea(AreaType.UNIT, levelId, {
      inclDevices: true,
    });

    const withCount: Area[] = [];
    for (let i = 0; i < result.length; i++) {
      withCount.push({
        ...result[i],
        DeviceCount: await this.locationService.unitDeviceCount(result[i].Id),
      });
    }

    return withCount;
  }

  @UseGuards(AuthGuard)
  @Query(() => [Area])
  async AreaByKeyword(@Args('filter') filter: string) {
    const result = await this.locationService.byKeyword(filter);

    const withCount: Area[] = [];
    for (let i = 0; i < result.length; i++) {
      withCount.push({
        ...result[i],
        DeviceCount:
          result[i].Type === AreaType.PROPERTY
            ? await this.locationService.propertyDeviceCount(result[i].Id)
            : result[i].Type === AreaType.LEVEL
              ? await this.locationService.levelDeviceCount(result[i].Id)
              : result[i].Devices.length,
      });
    }

    return withCount;
  }
}
