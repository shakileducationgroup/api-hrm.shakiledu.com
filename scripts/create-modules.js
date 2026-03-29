const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Create an interface for reading input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to create the folder structure
const createFolderStructure = (folderName) => {
  // Define the path to the existing modules directory
  const baseDir = path.join(
    __dirname,
    "..",
    "src",
    "app",
    "modules",
    folderName,
  );

  // List of subfolders to create
  const subfolders = [
    "controller",
    "service",
    "repository",
    "routes",
    "types",
    "validation",
  ];

  // Create the main folder if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Create each subfolder and corresponding .js files
  subfolders.forEach((subfolder) => {
    const dirPath = path.join(baseDir, subfolder);
    fs.mkdirSync(dirPath, { recursive: true });

    // Create the corresponding .js file in each subfolder
    const filePath = path.join(dirPath, `${folderName}.${subfolder}.ts`); // Adjust file name as necessary
    fs.writeFileSync(filePath, "", "utf8");
  });

  console.log(`Structure for ${folderName} created successfully!`);
  process.exit(1);
};

// Get folder name from command line arguments or prompt the user
const folderName = process.argv[2];

if (folderName) {
  createFolderStructure(folderName);
} else {
  rl.question("Please provide a folder name: ", (input) => {
    createFolderStructure(input);
    rl.close();
  });
}
