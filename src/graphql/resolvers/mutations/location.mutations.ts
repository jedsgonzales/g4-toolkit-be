import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators/roles.decorator';
import { Area, LevelAreaInput, PropertyAreaInput, UnitAreaInput } from 'src/graphql/models/db/area';
import { AuthGuard } from 'src/guards/admin.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { AreaService } from 'src/services/db/area.service';
import { GraphQLContext } from 'src/types/graphql.ctx';
import { AreaType } from 'src/types/smart_g4';

@Resolver()
export class LocationMutations {
  constructor(
    @Inject(forwardRef(() => AreaService))
    private readonly areaService: AreaService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Area)
  async SaveProperty(
    @Args('Property') input: PropertyAreaInput,
    @Context() ctx: GraphQLContext,
  ) {
    return await this.areaService.saveArea(
      { ...input, Type: AreaType.PROPERTY, ParentAreaId: null, },
      ctx.req.user.Username,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Area)
  async SavePropertyLevel(
    @Args('Level') input: LevelAreaInput,
    @Context() ctx: GraphQLContext,
  ) {
    return await this.areaService.saveArea(
      { ...input, Type: AreaType.LEVEL },
      ctx.req.user.Username,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Area)
  async SavePropertyUnit(
    @Args('Unit') input: UnitAreaInput,
    @Context() ctx: GraphQLContext,
  ) {
    return await this.areaService.saveArea(
      { ...input, Type: AreaType.UNIT },
      ctx.req.user.Username,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Int)
  async DeleteArea(@Args({name: 'AreaIdList', type: () => [Int]}) ids: number[]) {
    return (await this.areaService.deleteArea(ids)).count;
  }
}
