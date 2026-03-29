import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";
import prisma from "../../../../lib/utils/prisma.utils";

export interface I_GlobalRepository {
  getCollectionCount<T extends Prisma.ModelName>({
    modelName,
    whereCondition,
  }: {
    modelName: T;
    whereCondition: Prisma.Args<PrismaClient[T], "count">["where"];
  }): Promise<number>;
}
class GlobalRepository {
  /**
   * Returns the count of a collection based on a given condition
   * @param {any} collectionInstance - The prisma collection instance
   * @param {Object} whereCondition - The condition to filter the collection by
   * @returns {Promise<number>} - The count of the collection
   */
  async getCollectionCount<
    T extends Prisma.ModelName, // e.g. "user", "order", "qcDetails"
  >({
    modelName,
    whereCondition,
  }: {
    modelName: T;
    whereCondition?: Prisma.TypeMap["model"][T]["operations"]["count"]["args"]["where"];
  }): Promise<number> {
    // @ts-ignore
    const model = prisma[modelName] as any;
    return await model.count({ where: whereCondition });
  }
}

export const globalRepository = new GlobalRepository();
export default GlobalRepository;
