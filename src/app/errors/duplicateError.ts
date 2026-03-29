import { TErrorSource, TReturnError } from "../interface/erros/error";

const handleDuplicity = (error: any): TReturnError => {
  // ? Regular expression to capture the value inside the curly braces
  const { errmsg } = error?.errorResponse;
  const extractMessage = errmsg.match(/{ name: "(.*?)" }/);

  const errorSources: TErrorSource[] = [
    {
      path: "",
      message: `${extractMessage && extractMessage[1]} is already exists`,
    },
  ];

  return {
    statusCode: 409,
    message: "Duplicate entry",
    errorSources,
  };
};
export default handleDuplicity;
