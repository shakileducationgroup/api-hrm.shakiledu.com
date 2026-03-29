import { ZodError, ZodIssue } from "zod";
import { TErrorSource, TReturnError } from "../interface/erros/error";

const handleZodError = (error: ZodError): TReturnError => {
  const errorSources: TErrorSource[] = error.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  const statusCode = 400;
  return {
    statusCode,
    message: `Validation error: ${errorSources
      .map((issue) => issue.message)
      .join(", ")
      .slice(0, 80)}...`,
    errorSources,
  };
};

export default handleZodError;
