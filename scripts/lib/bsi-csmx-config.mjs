/**
 * Load + validate BSI-CSMX property enrich config JSON.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export function loadBsiCsmxConfig(configPath) {
  const abs = resolve(configPath);
  if (!existsSync(abs)) {
    throw new Error(`Config not found: ${abs}`);
  }
  const cfg = JSON.parse(readFileSync(abs, 'utf8'));
  const missing = [];
  if (!cfg.property_id) missing.push('property_id');
  if (!cfg.property_key) missing.push('property_key');
  if (!cfg.box?.root) missing.push('box.root');
  if (missing.length) {
    throw new Error(`Invalid config (${abs}): missing ${missing.join(', ')}`);
  }
  cfg._path = abs;
  return cfg;
}

export function scriptPath(cfg, key) {
  const rel = cfg.steps?.[key];
  if (!rel) return null;
  return resolve(resolve(cfg._path, '..', '..'), rel);
}
