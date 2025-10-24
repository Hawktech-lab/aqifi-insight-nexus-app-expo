const fs = require('fs');
const path = require('path');

// Function to convert @ imports to relative paths
function convertImportToRelative(importPath, currentFilePath) {
  if (!importPath.startsWith('@/')) {
    return importPath;
  }

  // Remove the @/ prefix
  const modulePath = importPath.substring(2);
  
  // Get the directory of the current file
  const currentDir = path.dirname(currentFilePath);
  
  // Calculate relative path from current file to src directory
  const relativeToSrc = path.relative(currentDir, path.join(__dirname, 'src'));
  
  // Build the new import path
  const newPath = path.join(relativeToSrc, modulePath).replace(/\\/g, '/');
  
  // Ensure the path starts with ./
  return newPath.startsWith('.') ? newPath : './' + newPath;
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace @ imports with relative paths
    const newContent = content.replace(
      /import\s+.*?\s+from\s+['"`](@\/[^'"`]+)['"`]/g,
      (match, importPath) => {
        const newImportPath = convertImportToRelative(importPath, filePath);
        modified = true;
        return match.replace(importPath, newImportPath);
      }
    );
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to recursively find and process files
function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

// Start processing from the src directory
console.log('Converting @ imports to relative paths...');
processDirectory(path.join(__dirname, 'src'));
console.log('Done!');
