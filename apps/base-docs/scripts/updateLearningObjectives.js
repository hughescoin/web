const fs = require('fs');
const path = require('path');

// Determine the base directory relative to the script's location
const scriptDir = __dirname;

// Paths for your project
const sidebarFilePath = path.join(scriptDir, '../base-learn/sidebars.js');
const docsBasePath = path.join(scriptDir, '../base-learn/docs');
const outputFilePath = path.join(docsBasePath, 'learning-objectives.md'); // Output in the same directory as welcome.md

// Function to extract the objectives from a file
function extractObjectivesFromFile(filePath, docId) {
  console.log(`Opening file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = fileContent.match(/^title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';
  console.log(`Found title: ${title}`);

  const relativeLink = `./${docId.replace('docs/', '')}.md`;

  const objectives = [];
  const lines = fileContent.split('\n');
  let inObjectives = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## Objectives')) {
      inObjectives = true;
      console.log(`Found Objectives section in ${filePath}`);
      continue;
    }

    if (inObjectives) {
      if (line.startsWith('## ')) {
        console.log(`Encountered a new H2, stopping objective capture in ${filePath}`);
        break; // Stop if a new H2 is found
      }
      if (line.startsWith('- ')) {
        console.log(`Captured objective: ${line}`);
        objectives.push(line);
      }
    }
  }

  if (objectives.length > 0) {
    return { title, objectives, relativeLink };
  }

  console.log(`No objectives found in ${filePath}`);
  return null;
}

// Main function to read the sidebar and process each file
function processSidebar() {
  const sidebarContent = fs.readFileSync(sidebarFilePath, 'utf-8');
  const filePattern = /id:\s*['"]([^'"]+)['"]/g;

  let outputContent = `<!--\nThis file is automatically generated by a script. Do not edit it directly.\nUse the script to regenerate this file.\n-->\n\n`;

  const matches = [...sidebarContent.matchAll(filePattern)];
  matches.forEach((match) => {
    const docId = match[1];
    if (docId.includes('-vid')) {
      console.log(`Skipping video file: ${docId}`);
      return;
    }

    const docPath = docId.replace('docs/', '') + '.md'; // Remove 'docs/' and add '.md'

    // Skip overview.md files
    if (docPath.endsWith('overview.md')) {
      console.log(`Skipping overview file: ${docPath}`);
      return;
    }

    const filePath = path.join(docsBasePath, docPath);
    console.log(`Processing file: ${filePath}`);
    const result = extractObjectivesFromFile(filePath, docId);
    if (result) {
      outputContent += `### [${result.title}](${result.relativeLink})\n\n`;
      outputContent += result.objectives.join('\n') + '\n\n';
    }
  });

  if (outputContent.trim()) {
    fs.writeFileSync(outputFilePath, outputContent.trim(), 'utf-8');
    console.log(`Learning objectives extracted to ${outputFilePath}`);
  } else {
    console.log('No objectives were found.');
  }
}

processSidebar();
