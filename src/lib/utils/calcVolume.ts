import { HttpStatusCode } from "axios";
import AppError from "../../app/errors/appError";

/**
 * Calculate the volume of a box given its dimensions in centimeters.
 *
 * @throws {AppError} If any of the dimensions are not positive numbers.
 *
 * @param {Object} params - An object containing the dimensions of the box.
 * @param {number} params.lengthCm - The length of the box in centimeters.
 * @param {number} params.widthCm - The width of the box in centimeters.
 * @param {number} params.heightCm - The height of the box in centimeters.
 * @returns {number} The volume of the box in cubic centimeters.
 */
export function calculateVolume({
  lengthCm,
  widthCm,
  heightCm,
}: {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}) {
  // Validate inputs
  if (
    typeof lengthCm !== "number" ||
    typeof widthCm !== "number" ||
    typeof heightCm !== "number"
  ) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "All dimensions must be numbers",
    );
  }
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "All dimensions must be positive numbers",
    );
  }

  // Calculate volume in cubic centimeters
  return lengthCm * widthCm * heightCm;
}
