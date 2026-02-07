#!/usr/bin/env bun

/**
 * Convex Environment Variables Setup Script
 *
 * This script reads variables from .env.convex.dev and .env.convex.prod
 * and sets them in Convex for their respective environments.
 *
 * Usage:
 *   bun run setup:convex       # Set both dev and prod (uses separate files)
 *   bun run setup:convex:dev   # Set dev only (from .env.convex.dev)
 *   bun run setup:convex:prod  # Set prod only (from .env.convex.prod)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ENV_FILE_DEV = ".env.convex.dev";
const ENV_FILE_PROD = ".env.convex.prod";
const BACKEND_DIR = "packages/backend";

interface EnvVar {
  key: string;
  value: string;
}

function parseEnvFile(filePath: string, environment: "dev" | "prod"): EnvVar[] {
  if (!existsSync(filePath)) {
    console.error(`❌ Error: ${filePath} file not found!`);
    console.log("\n📝 Create one from the template:");
    if (environment === "dev") {
      console.log("   cp .env.convex.dev.example .env.convex.dev");
      console.log("   # Then edit .env.convex.dev with your dev values\n");
    } else {
      console.log("   cp .env.convex.prod.example .env.convex.prod");
      console.log("   # Then edit .env.convex.prod with your prod values\n");
    }
    process.exit(1);
  }

  const content = readFileSync(filePath, "utf-8");
  const envVars: EnvVar[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Only add if value is not empty
      if (value.trim()) {
        envVars.push({ key, value: value.trim() });
      }
    }
  }

  return envVars;
}

function setConvexEnv(
  key: string,
  value: string,
  environment: "dev" | "prod"
): boolean {
  const flag = environment === "prod" ? "--prod" : "";
  const command = `bunx convex env set ${key} "${value}" ${flag}`.trim();

  try {
    execSync(command, {
      cwd: BACKEND_DIR,
      stdio: "pipe",
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to set ${key} for ${environment}`);
    if (error instanceof Error) {
      console.error(`      ${error.message}`);
    }
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const devOnly = args.includes("--dev-only");
  const prodOnly = args.includes("--prod-only");

  console.log("🚀 Convex Environment Variables Setup\n");

  // Track success/failure
  let devSuccess = 0;
  let devFailed = 0;
  let prodSuccess = 0;
  let prodFailed = 0;

  // Setup dev environment
  if (!prodOnly) {
    console.log("📦 Setting up DEVELOPMENT environment...\n");
    const devFilePath = join(process.cwd(), ENV_FILE_DEV);
    const devVars = parseEnvFile(devFilePath, "dev");

    if (devVars.length === 0) {
      console.error(`❌ No environment variables found in ${ENV_FILE_DEV}`);
      console.log("   Make sure your variables are in KEY=value format\n");
      process.exit(1);
    }

    console.log(`📋 Found ${devVars.length} variables for dev\n`);

    for (const { key, value } of devVars) {
      console.log(`⚙️  ${key}`);
      const success = setConvexEnv(key, value, "dev");
      if (success) {
        console.log("   ✅ Set for dev");
        devSuccess++;
      } else {
        devFailed++;
      }
      console.log();
    }
  }

  // Setup prod environment
  if (!devOnly) {
    console.log("🚀 Setting up PRODUCTION environment...\n");
    const prodFilePath = join(process.cwd(), ENV_FILE_PROD);
    const prodVars = parseEnvFile(prodFilePath, "prod");

    if (prodVars.length === 0) {
      console.error(`❌ No environment variables found in ${ENV_FILE_PROD}`);
      console.log("   Make sure your variables are in KEY=value format\n");
      process.exit(1);
    }

    console.log(`📋 Found ${prodVars.length} variables for prod\n`);

    for (const { key, value } of prodVars) {
      console.log(`⚙️  ${key}`);
      const success = setConvexEnv(key, value, "prod");
      if (success) {
        console.log("   ✅ Set for prod");
        prodSuccess++;
      } else {
        prodFailed++;
      }
      console.log();
    }
  }

  // Summary
  console.log("━".repeat(50));
  console.log("\n📊 Summary:\n");

  if (!prodOnly) {
    console.log(`   Dev:  ✅ ${devSuccess} set, ❌ ${devFailed} failed`);
  }
  if (!devOnly) {
    console.log(`   Prod: ✅ ${prodSuccess} set, ❌ ${prodFailed} failed`);
  }

  const totalFailed = devFailed + prodFailed;
  if (totalFailed > 0) {
    console.log(
      `\n⚠️  ${totalFailed} variable(s) failed to set. Check the errors above.\n`
    );
    process.exit(1);
  }

  console.log("\n✨ All environment variables configured successfully!\n");
  console.log("🔍 Verify in Convex Dashboard:");
  console.log("   https://dashboard.convex.dev\n");
}

main();
