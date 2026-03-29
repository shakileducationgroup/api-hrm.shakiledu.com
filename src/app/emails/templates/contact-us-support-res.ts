export type T_CustomerPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id: string;
  message: string;
};
export const contactUsSupportTeamEmailTemplate = (
  name: string,
  subject: string,
  customerPayload: T_CustomerPayload,
) => {
  return ``;
};
