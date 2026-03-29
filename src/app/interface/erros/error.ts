export type TErrorSource = {
  path: string | number; // ? The path which contain the error could be the field name
  message: string; // ? The error message
};

export type TReturnError = {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
};
