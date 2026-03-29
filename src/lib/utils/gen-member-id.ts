export function generateMemberId(firstName: string) {
  // 1. Clean and split the name
  const cleanedName = firstName.trim().toLowerCase().replace(/\s+/g, "-");

  // 2. Get current date parts
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits (e.g., "25")
  const month = String(now.getMonth() + 1).padStart(2, "0"); // "01" to "12"
  const day = String(now.getDate()).padStart(2, "0"); // "01" to "31"

  // 3. Generate random 2-digit number (00-99)
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0"); // pad start until it reaches the length

  // 4. Combine all parts
  return `${cleanedName}${year}${month}${day}${random}`;
}

// output would be:
//console.log(generateMemberId("Tanvir Hossain")); // Output: "tanvir25080542"
