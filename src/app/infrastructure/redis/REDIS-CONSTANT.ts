import { convertToSeconds } from "../../../lib/utils/TimeConvertor";

export const redisConfig = {
  TTL_FOR_PACKAGE_GET_PAYLOAD: convertToSeconds(10, "minutes"), // 10 minutes
  TTL_FOR_ORDERS_GET_PAYLOAD: convertToSeconds(10, "minutes"), // 10 minutes
  TTL_FOR_M_LEVEL: convertToSeconds(5, "minutes"), // 05 minutes
  TTL_FOR_U_M_LEVEL: convertToSeconds(5, "minutes"), // 05 minutes // User membership level details list
  TTL_FOR_X_RATE_LEVEL: convertToSeconds(12, "hours"), // 05 minutes // User membership level details list
  TTL_FOR_CART_ORDER: convertToSeconds(30, "minutes"), // 30 minutes for cart/order cache
  TTL_FOR_CART_ITEMS: convertToSeconds(30, "minutes"), // 30 minutes for cart items cache
};
