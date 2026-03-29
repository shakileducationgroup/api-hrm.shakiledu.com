import { Router } from "express";

import sendResponse from "../../lib/utils/sendResponse";
import env from "../config/clean-env";
import { authRoutes } from "../modules/auth/routes/auth.routes";

import { HttpStatusCode } from "axios";
import {  UserRoutes } from "../modules/user/routes/user.route";

const routes = Router();

export type T_RouteModules = { path: string; routes: Router };

const routesModule: T_RouteModules[] = [
  {
    path: "/users",
    routes: UserRoutes,
  },
  {
    path: "/auth",
    routes: authRoutes,
  },

  

  // Extra but
  {
    path: "/route-lists",
    routes: routes.get("/", async (req, res) => {
      sendResponse(res, {
        statusCode: HttpStatusCode.Ok,
        success: true,
        message: "Route Lists",
        data: routesModule.map(
          (item: T_RouteModules) =>
            `${env.isDev ? env.LOCAL_BACKEND_URL : env.PROD_BACKEND_URL}/api/v1/${item.path}`,
        ),
      });
    }),
  },
];

// TODO: Implement routes here
routesModule.forEach((item: T_RouteModules) =>
  routes.use(item.path, item.routes),
);

export default routes;
