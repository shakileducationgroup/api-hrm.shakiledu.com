import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

type DateInput = Date | string; // Date can be a Date object or an ISO string.
const TIMEZONE = "Asia/Dhaka"; // Pakistan Standard Time (UTC+5)

function formatDateWithDateFns(
  date: DateInput,
  formatStyle: "iso" | "utc" | "relative" | "readable" | "date" = "iso",
): string | null {
  // Handle string input by parsing it to Date object if necessary
  let dateObj: Date;

  if (typeof date === "string") {
    // Parse ISO string if it's a valid ISO format
    dateObj = isValid(parseISO(date)) ? parseISO(date) : new Date(date);
  } else {
    dateObj = date;
  }

  if (!isValid(dateObj)) return null; // Return null if the date is invalid

  // Convert UTC to local timezone (Asia/Karachi for Pakistan)
  const zonedDate = toZonedTime(dateObj, TIMEZONE);

  // Format as ISO (default)
  if (formatStyle === "iso") {
    return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  }

  // Format as UTC
  if (formatStyle === "utc") {
    return format(dateObj, "EEE, dd MMM yyyy HH:mm:ss OOOO");
  }

  // Format as date only (e.g., '26th Jan, 2026')
  if (formatStyle === "date") {
    return format(zonedDate, "do MMM, yyyy");
  }

  // Format as readable with timezone conversion (e.g., '25th Jan 2026 10:00 AM')
  if (formatStyle === "readable") {
    return format(zonedDate, "do MMM yyyy hh:mm a");
  }

  // Example of relative time (e.g., '3 days ago')
  if (formatStyle === "relative") {
    return formatDistanceToNow(dateObj) + " ago";
  }

  return null;
}
export default formatDateWithDateFns;
// // Example usage:
// const prismaDate = new Date(); // A Date object
// console.log(formatDateWithDateFns(prismaDate, "iso")); // ISO format
// console.log(formatDateWithDateFns(prismaDate, "utc")); // UTC format
// console.log(formatDateWithDateFns(prismaDate, "date")); // Date only
// console.log(formatDateWithDateFns(prismaDate, "readable")); // Readable format
// console.log(formatDateWithDateFns("2025-10-30T15:30:00.000Z", "relative")); // Relative time

/**
 * Example Outputs:
 * ISO Format: 2025-10-30T15:30:00.000Z
 * UTC Format: Tue, 30 Oct 2025 15:30:00 GMT
 * Date Only: 30th Oct, 2025
 * Readable Format: 30th Oct 2025 03:30 PM
 * Relative Time: '5 minutes ago'
 *  */
