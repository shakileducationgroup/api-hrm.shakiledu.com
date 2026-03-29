import { HttpStatusCode } from "axios";
import AppError from "../../../errors/appError";
import { uploadRepository } from "../repository/upload.repository";
import { I_LinkFileToEntity } from "../types/upload.types";

class LinkFileToTable {
  /**
   * Link file to an entity (User, Lead, Note, Country)
   */
  async linkFileToEntity(payload: I_LinkFileToEntity) {
    // Verify file exists
    const file = await uploadRepository.getFileById(payload.fileId);
    if (!file) {
      throw new AppError(HttpStatusCode.NotFound, "File not found");
    }

    // Link based on entity type
    switch (payload.entityType) {
      case "USER":
        return uploadRepository.linkFileToUser(
          payload.entityId,
          payload.fileId,
          payload.fileType
        );

      case "LEAD":
        return uploadRepository.linkFileToLead(
          payload.entityId,
          payload.fileId,
          payload.fileType
        );

      case "NOTE":
        return uploadRepository.linkFileToNote(
          payload.entityId,
          payload.fileId
        );

      case "COUNTRY":
        return uploadRepository.linkFileToCountry(
          payload.entityId,
          payload.fileId,
          payload.fileType
        );

      default:
        throw new AppError(HttpStatusCode.BadRequest, "Invalid entity type");
    }
  }
}

export const linkFileToTableService = new LinkFileToTable();
