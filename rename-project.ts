#!/usr/bin/env bun

/**
 * Script to replace all occurrences of "yugen" (case-insensitive) with a new project name
 *
 * Usage: bun run rename-project <new-project-name>
 * Example: bun run rename-project myapp
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const NEW_PROJECT_NAME = process.argv[2];

if (!NEW_PROJECT_NAME) {
  console.error("Error: Project name is required");
  console.error("Usage: bun run rename-project <new-project-name>");
  console.error("Example: bun run rename-project myapp");
  process.exit(1);
}

// Validate project name (should be valid npm package name)
const npmNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
if (!npmNameRegex.test(NEW_PROJECT_NAME)) {
  console.error(
    "Error: Invalid project name. Must be a valid npm package name."
  );
  console.error("Examples: myapp, @myorg/myapp");
  process.exit(1);
}

// Extract base name if scoped package (e.g., "@myorg/myapp" -> "myapp")
const BASE_NAME = NEW_PROJECT_NAME.includes("/")
  ? NEW_PROJECT_NAME.split("/")[1]!
  : NEW_PROJECT_NAME;

// Extract org name if scoped package (e.g., "@myorg/myapp" -> "myorg")
const ORG_NAME = NEW_PROJECT_NAME.includes("/")
  ? NEW_PROJECT_NAME.split("/")[0]!.replace("@", "")
  : null;

// Generate different case variants
const variants = {
  lowercase: BASE_NAME.toLowerCase(),
  capitalized:
    BASE_NAME.charAt(0).toUpperCase() + BASE_NAME.slice(1).toLowerCase(),
  uppercase: BASE_NAME.toUpperCase(),
  scoped: {
    lowercase: NEW_PROJECT_NAME.includes("/")
      ? NEW_PROJECT_NAME
      : `@${BASE_NAME.toLowerCase()}`,
    capitalized: NEW_PROJECT_NAME.includes("/")
      ? `@${ORG_NAME!.charAt(0).toUpperCase() + ORG_NAME!.slice(1).toLowerCase()}/${BASE_NAME.charAt(0).toUpperCase() + BASE_NAME.slice(1).toLowerCase()}`
      : `@${BASE_NAME.charAt(0).toUpperCase() + BASE_NAME.slice(1).toLowerCase()}`,
    uppercase: NEW_PROJECT_NAME.includes("/")
      ? `@${ORG_NAME!.toUpperCase()}/${BASE_NAME.toUpperCase()}`
      : `@${BASE_NAME.toUpperCase()}`,
  },
};

// Directories and files to skip
const SKIP_DIRS = [
  "node_modules",
  ".git",
  "dist",
  ".next",
  ".turbo",
  "build",
  "coverage",
  ".cache",
  "convex/_generated",
  "routeTree.gen.ts",
  "rename-project.ts", // Don't modify this script itself!
];

// File extensions to process (excluding .mdx)
const TEXT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".html",
  ".sh",
  ".toml",
  ".yaml",
  ".yml",
];

const changedFiles: string[] = [];

function preserveCase(matched: string, replacement: string): string {
  // If all uppercase
  if (matched === matched.toUpperCase()) {
    return replacement.toUpperCase();
  }
  // If all lowercase
  if (matched === matched.toLowerCase()) {
    return replacement.toLowerCase();
  }
  // If first letter uppercase (capitalized)
  if (
    matched[0] === matched[0]!.toUpperCase() &&
    matched.slice(1) === matched.slice(1).toLowerCase()
  ) {
    return (
      replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase()
    );
  }
  // Mixed case - preserve the pattern
  const result: string[] = [];
  for (let i = 0; i < Math.min(matched.length, replacement.length); i++) {
    if (matched[i] === matched[i]!.toUpperCase()) {
      result.push(replacement[i]!.toUpperCase());
    } else {
      result.push(replacement[i]!.toLowerCase());
    }
  }
  // If replacement is longer, append remaining in lowercase
  if (replacement.length > matched.length) {
    result.push(replacement.slice(matched.length).toLowerCase());
  }
  return result.join("");
}

function replaceInContent(content: string): string {
  let result = content;

  // Use a single comprehensive regex that matches all "yugen" occurrences
  // and replaces them based on context
  result = result.replace(/yugen/gi, (match, offset, string) => {
    const before = offset > 0 ? string[offset - 1] : "";
    const after =
      offset + match.length < string.length
        ? string[offset + match.length]
        : "";
    const matchUpper = match.toUpperCase();

    // Handle scoped packages: @yugen/... -> @newproject/...
    if (before === "@" && after === "/") {
      if (matchUpper === "YUGEN" && match === match.toUpperCase()) {
        // All uppercase: @YUGEN/ -> @NEWPROJECT/
        return variants.scoped.uppercase.replace("@", "");
      }
      if (
        match[0] === match[0]!.toUpperCase() &&
        match.slice(1).toLowerCase() === match.slice(1)
      ) {
        // Capitalized: @Yugen/ -> @Newproject/
        return variants.scoped.capitalized.replace("@", "");
      }
      // Lowercase: @yugen/ -> @newproject/
      return variants.scoped.lowercase.replace("@", "");
    }

    // Handle hyphenated: yugen-... -> newproject-...
    if (after === "-") {
      return preserveCase(match, variants.lowercase);
    }

    // Handle standalone yugen (not preceded by @ or followed by / or -)
    // This covers: "Yugen", "yugen", "YUGEN" in strings, JSON values, etc.
    return preserveCase(match, variants.lowercase);
  });

  return result;
}

function shouldSkipDirectory(path: string): boolean {
  const relativePath = relative(process.cwd(), path);

  // Skip if in skip directories
  for (const skipDir of SKIP_DIRS) {
    if (relativePath.includes(skipDir)) {
      return true;
    }
  }

  return false;
}

function shouldSkipFile(path: string): boolean {
  const relativePath = relative(process.cwd(), path);

  // Skip .mdx files
  if (path.endsWith(".mdx")) {
    return true;
  }

  // Skip if in skip directories
  for (const skipDir of SKIP_DIRS) {
    if (relativePath.includes(skipDir)) {
      return true;
    }
  }

  // Skip if not a text file
  const isTextFile = TEXT_EXTENSIONS.some((ext) => path.endsWith(ext));
  if (!isTextFile) {
    return true;
  }

  return false;
}

async function processFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, "utf-8");
    const newContent = replaceInContent(content);

    if (content !== newContent) {
      await writeFile(filePath, newContent, "utf-8");
      changedFiles.push(filePath);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dirPath: string): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(fullPath)) {
          await processDirectory(fullPath);
        }
      } else if (entry.isFile() && !shouldSkipFile(fullPath)) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

async function main() {
  console.log(`Renaming project from "yugen" to "${NEW_PROJECT_NAME}"...\n`);
  console.log("Variants:");
  console.log(`  Lowercase: ${variants.lowercase}`);
  console.log(`  Capitalized: ${variants.capitalized}`);
  console.log(`  Uppercase: ${variants.uppercase}`);
  console.log(`  Scoped (lowercase): ${variants.scoped.lowercase}`);
  console.log(`  Scoped (capitalized): ${variants.scoped.capitalized}`);
  console.log(`  Scoped (uppercase): ${variants.scoped.uppercase}\n`);

  const rootDir = process.cwd();
  await processDirectory(rootDir);

  console.log("\n✅ Replacement complete!");
  console.log(`\nChanged ${changedFiles.length} file(s):`);

  if (changedFiles.length > 0) {
    for (const file of changedFiles) {
      console.log(`  - ${relative(rootDir, file)}`);
    }
    console.log("\n✅ All done! Files have been updated.");
  } else {
    console.log(
      "\n⚠️  No files were changed. Make sure 'yugen' exists in your codebase."
    );
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
