#!/usr/bin/env node
/**
 * Shared Postiz CLI runner for this skill.
 *
 * Uses the official `postiz` CLI and supports:
 * - Hosted Postiz (default API URL)
 * - Self-hosted Postiz via config.postiz.apiUrl -> POSTIZ_API_URL
 */

const { execFile } = require('child_process');

function getPostizEnv(config) {
  const apiKey = config?.postiz?.apiKey;
  if (!apiKey) {
    throw new Error('Missing config.postiz.apiKey');
  }

  const env = { ...process.env, POSTIZ_API_KEY: apiKey };
  if (config?.postiz?.apiUrl) {
    env.POSTIZ_API_URL = config.postiz.apiUrl;
  }

  return env;
}

function execFileAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseJsonFromOutput(raw) {
  const output = (raw || '').trim();
  if (!output) {
    return null;
  }

  try {
    return JSON.parse(output);
  } catch (_e) {
    // Continue and try to parse the trailing JSON payload after status lines.
  }

  for (let i = 0; i < output.length; i++) {
    const ch = output[i];
    if (ch !== '{' && ch !== '[') continue;
    try {
      return JSON.parse(output.slice(i));
    } catch (_e) {
      // Keep scanning.
    }
  }

  throw new Error(`Could not parse JSON from Postiz CLI output:\n${output}`);
}

async function runPostiz(args, config) {
  const env = getPostizEnv(config);
  const candidates = [
    { command: 'postiz', args: [] },
    { command: 'npx', args: ['--yes', 'postiz'] }
  ];

  const errors = [];
  for (const candidate of candidates) {
    try {
      const fullArgs = [...candidate.args, ...args];
      const { stdout } = await execFileAsync(candidate.command, fullArgs, {
        env,
        maxBuffer: 1024 * 1024 * 10
      });
      return parseJsonFromOutput(stdout);
    } catch (error) {
      if (error.code === 'ENOENT') {
        errors.push(`${candidate.command} not found`);
        continue;
      }

      const stderr = (error.stderr || '').trim();
      const stdout = (error.stdout || '').trim();
      const details = stderr || stdout || error.message;
      throw new Error(`Postiz CLI failed (${args.join(' ')}): ${details}`);
    }
  }

  throw new Error(
    `Postiz CLI is not available (${errors.join(', ')}). Install it with "npm i -g postiz" or ensure "npx" is available.`
  );
}

module.exports = { runPostiz };
