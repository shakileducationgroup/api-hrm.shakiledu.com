/**
 * Generate a random password with uppercase, lowercase, numbers, and special characters
 * @param length - Length of password (default: 12)
 * @returns Random generated password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = upperCase + lowerCase + numbers + specialChars;

  let password = "";
  // Ensure at least one char from each category
  password += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
  password += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialChars.charAt(
    Math.floor(Math.random() * specialChars.length),
  );

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
