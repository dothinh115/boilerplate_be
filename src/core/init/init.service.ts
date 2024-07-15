import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, HttpAdapterHost, Reflector } from '@nestjs/core';
import { getMetadata } from '../utils/metadata.util';
import { ROUTE_METADATA, getProperties } from '../decorators/route.decorator';
import { colorLog } from '../utils/color-console-log.util';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MethodType, Route } from '../route/entities/route.entity';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    private discoveryService: DiscoveryService,
    private reflector: Reflector,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Route) private routeRepo: Repository<Route>,
    private configService: ConfigService,
    private adapterHost: HttpAdapterHost,
  ) {}

  async onModuleInit() {
    await this.createRoutes();
    await this.createRootUser();
  }

  private async createRoutes() {
    const httpAdapter = this.adapterHost.httpAdapter;
    const server = httpAdapter.getHttpServer();
    const router = server._events.request._router;

    const routes: { path: string; method: MethodType; isProtected: boolean }[] =
      router.stack
        .map((routeItem) => {
          if (routeItem.route) {
            return {
              path: routeItem.route.path,
              method: Object.keys(routeItem.route.methods)[0],
              isProtected: false,
            };
          }
        })
        .filter((route) => route !== undefined);
    const controllers = this.discoveryService.getControllers();
    controllers.map(async (controller) => {
      const { metatype } = controller;
      const isRouteController = getMetadata(ROUTE_METADATA, metatype, '');
      if (isRouteController) {
        const properties: { path: string; method: MethodType }[] =
          getProperties(metatype);
        const controllerPath = this.reflector.get<string>('path', metatype);
        properties.forEach((property) => {
          const findIndex = routes.findIndex(
            (route) =>
              route.path ===
                `/${controllerPath}${property.path ? `/${property.path}` : ''}` &&
              route.method === property.method,
          );
          if (findIndex !== -1) routes[findIndex].isProtected = true;
        });
      }
    });
    const createdRoute = [];
    for (const route of routes) {
      const isExists = await this.routeRepo.findOne({
        where: {
          path: route.path,
          method: route.method,
        },
      });
      if (isExists) {
        isExists.isProtected = route.isProtected;
        createdRoute.push(isExists);
      } else {
        const newRoute = this.routeRepo.create(route);
        createdRoute.push(newRoute);
      }
    }

    if (createdRoute.length > 0) {
      await this.routeRepo.save(createdRoute);
    }
  }

  private async createRootUser() {
    const isRootUserExists = await this.userRepo.exists({
      where: {
        rootUser: true,
      },
    });
    if (!isRootUserExists) {
      const rootUser = this.userRepo.create({
        email: this.configService.get('ROOT_USER_EMAIL'),
        password: this.configService.get('ROOT_USER_PASSWORD'),
        rootUser: true,
      });
      await this.userRepo.save(rootUser);
      colorLog('Đã tạo thành công rootUser', 'fgRed');
      colorLog('email: ' + this.configService.get('ROOT_USER_EMAIL'), 'bgBlue');
      colorLog(
        'password: ' + this.configService.get('ROOT_USER_PASSWORD'),
        'bgBlue',
      );
    }
  }
}
