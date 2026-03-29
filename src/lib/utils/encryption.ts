import bcrypt from "bcrypt";
import env from "../../app/config/clean-env";

/* Every time any password will save to database will be hashed */
export const hashPwd = async (password: string) => {
  return await bcrypt.hash(password, Number(env.BCRYPT_SALT_ROUNDS));
};

// checking is given pwd and hashed pwd are same or not
export const validateEncryptedPassword = async (
  plainPassword: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
