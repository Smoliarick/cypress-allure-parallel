const fs = require("fs");
const exec = require("child_process").exec;

/**
 * Get all arguments with values from command line in 1 object
 * @returns command line arguments in object
 */
function getCommandLineArgs() {
  const args = {};
  let currentArgument;
  process.argv.forEach((argument) => {
    if (args.additional) {
      args.additional.push(argument);
    } else if (currentArgument) {
      args[currentArgument] = argument;
    }

    switch (argument) {
      // Directory with your autotests
      case "-d":
      case "-directory":
        currentArgument = "d";
        break;
      // Number of threads (depends on your processor)
      case "-t":
      case "-threads":
        currentArgument = "t";
        break;
      // Extension for Cypress spec files
      case "-ext":
        currentArgument = "ext";
        break;
      // Additional parameters for Cypress autotests
      case "--":
        currentArgument = "additional";
        args.additional = [];
        break;
      default:
        currentArgument = undefined;
    }
  });
  return args;
}

/**
 * Get all Cypress spec files
 * @param {string} directory directory where your cypress autotests are located
 * @param {string} ext extension for cypress autotests
 * @returns all Cypress spec files in array
 */
function getFiles(directory, ext = "cy.js") {
  try {
    const files = fs.readdirSync(`${directory}`, { recursive: true });
    const directoryPathForFiles = directory.replace("/", "\\");
    const cypressFiles = files
      .filter((f) => ~f.indexOf(ext))
      .map((f) => `.\\${directoryPathForFiles}\\${f}`);
    return cypressFiles;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Divide files to chunks and return as array of arrays
 * @param {string[]} files array with Cypress spec files
 * @param {number} numOfThreads number of threads (depends on your processor)
 * @returns array of arrays with Cypress spec files
 */
function getChunks(files, numOfThreads) {
  const result = [];
  const chunkSize = Math.ceil(files.length / numOfThreads);
  for (let i = 0; i < files.length; i += chunkSize) {
    result.push(files.slice(i, i + chunkSize));
  }
  return result;
}

function main() {
  const args = getCommandLineArgs();
  const files = getFiles(args.d, args.ext);
  const numOfThreads = args.t;
  const chunks = getChunks(files, numOfThreads);
  const commands = [];
  chunks.forEach((chunk) => {
    commands.push(
      `"npx cypress run --spec ${chunk.join(",")} ${args.additional.join(" ")}"`
    );
  });
  const concurrentlyCommand = `npx concurrently ${commands.join(" ")}`;
  exec(concurrentlyCommand, (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  });
}

main();
