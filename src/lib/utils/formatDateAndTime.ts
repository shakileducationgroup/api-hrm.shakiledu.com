import { format, parseISO } from "date-fns";

type FormatType = "time" | "date" | "full" | "fullWithShortMonth" | "shortDate";

export function formatDateAndTime(
  isoString: string,
  type: FormatType = "full",
): string {
  if (!isoString) return "";
  const date = parseISO(isoString);
  switch (type) {
    case "time":
      return format(date, "hh:mm a");
    case "date":
      return format(date, "dd MMMM yyyy");
    case "shortDate":
      return format(date, "dd MMM yyyy");
    case "fullWithShortMonth":
      return format(date, "dd MMM yyyy, hh:mm a");
    case "full":
    default:
      return format(date, "dd MMMM yyyy, hh:mm a");
  }
}
