export interface I_LoginBody {
  email: string;
  password: string;
}
export type T_ReqSourceType = "web" | "dash";
export type T_CookieNames =
  | "d_ss_id"
  | "d_r_ss_id"
  | "client_session_id"
  | "client_r_session_id";
