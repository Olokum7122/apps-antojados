#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * GUARDIAN CORE — Motor de cumplimiento del contrato HTTP/Render
 * ═══════════════════════════════════════════════════════════════
 *
 * Este NO es un proceso en background.
 * Es un INTERCEPTOR activo que:
 *   1. Verifica que se use el script PS1 oficial (no comandos sueltos)
 *   2. Bloquea builds si hay violaciones al contrato
 *   3. Fuerza version actual del pipeline
 *
 * @see docs/Contrato_Restrictivo_HTTP_Render_Seguro_v1.md
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Configuración ──────────────────────────────────────────────
const CONFIG = {
  version: '1.0.0',
  GATEWAY: 'https://api.antojadosmx.mx',

  // Patrones prohibidos en código fuente (Sección 4 del contrato)
  FORBIDDEN_PATTERNS: [
    { pattern: /http:\/\/185\.187\.235\.253(?::\d+)?/, severity: 'CRITICAL', label: 'IP directa HTTP' },
    { pattern: /http:\/\/localhost(?::\d+)?/, severity: 'CRITICAL', label: 'localhost HTTP' },
    { pattern: /http:\/\/127\.0\.0\.1(?::\d+)?/, severity: 'CRITICAL', label: 'loopback HTTP' },
    { pattern: /:4100/, severity: 'HIGH', label: 'puerto media engine' },
    { pattern: /:8010/, severity: 'HIGH', label: 'puerto API legacy' },
    { pattern: /:4101/, severity: 'MEDIUM', label: 'puerto explorer API' },
  ],

  // Directorios siempre excluidos
  EXCLUDE_DIRS: [
    'node_modules', '.git', '.quasar', 'dist', 'build',
    'DerivedData', 'public/assets', '.guardian',
    'src-capacitor', '.capacitor', 'www',
  ],

  // Extensiones a escanear
  INCLUDE_EXTENSIONS: [
    '.ts', '.vue', '.js', '.mjs',
    '.env', '.env.production', '.env.staging',
  ],

  // Archivos permitidos (referencias documentadas/defensivas)
  ALLOWED_FILES: [
    'normalize-media-url.ts',
    'normalize-media-url.js',
    'guardian-core.mjs',
    'docs/Contrato_Restrictivo_HTTP_Render_Seguro_v1.md',
  ],

  // Líneas permitidas (console.log dev, defaults de servidor, comments)
  ALLOWED_LINES: [
    // Dev console URLs (solo para desarrollador, no consumidas)
    "console.log(`Antojados iOS V2 web: http://localhost:${port}/`)",
    // Config default de servidor backend (no es consumido por frontend)
    "process.env.ME_MEDIA_BASE_URL || 'http://localhost:4100'",
    "EXPLORER_API_URL || 'http://localhost:4101'",
    "MEDIA_ENGINE_URL || 'http://localhost:4100'",
    // Comentarios documentando infraestructura
    '// Media Engine V3 endpoints (proxy Nginx: /api/media/* → localhost:4100)',
    // Dev console log del servidor (no es consumido por frontend)
    'console.log(`[explorer-api] listening on http://localhost:${config.port}`);',
    // URL fixer defensivo: reemplaza localhost por HTTPS público (mediaPackage.resolver.js)
    'return url.replace(/http:\\/\\/localhost:\\d+/i, PUBLIC_MEDIA_BASE);',
  ],

  // Rutas de deploy PS1 oficiales
  OFFICIAL_DEPLOY_SCRIPTS: [
    'scripts/deploy-android.ps1',
    'scripts/deploy-ios.ps1',
    'scripts/deploy-api-gateway.ps1',
  ],
};

// ── Sistema de reporte ─────────────────────────────────────────
let violations = [];
let warnings = [];

function addViolation(file, pattern, severity, line) {
  violations.push({ file, pattern, severity, line });
}

function addWarning(msg) {
  warnings.push(msg);
}

function generateReport() {
  let report = [];
  report.push('═══════════════════════════════════════════════════════════════');
  report.push(' GUARDIAN — Reporte de Cumplimiento del Contrato HTTP/Render');
  report.push(` Versión pipeline: ${CONFIG.version}`);
  report.push(` Gateway oficial: ${CONFIG.GATEWAY}`);
  report.push('═══════════════════════════════════════════════════════════════');
  report.push('');

  if (violations.length === 0 && warnings.length === 0) {
    report.push(' ✅ SIN VIOLACIONES — El sistema cumple el contrato.');
    report.push('');
    return report.join('\n');
  }

  if (violations.length > 0) {
    report.push(` 🔴 ${violations.length} VIOLACION(ES) ACTIVA(S):`);
    report.push('');
    for (const v of violations) {
      report.push(`   [${v.severity}] ${v.pattern} → ${v.file}:${v.line || '?'}`);
    }
    report.push('');
  }

  if (warnings.length > 0) {
    report.push(` 🟡 ${warnings.length} ADVERTENCIA(S):`);
    report.push('');
    for (const w of warnings) {
      report.push(`   ⚠  ${w}`);
    }
    report.push('');
  }

  report.push('─────────────────────────────────────────────────────────');
  report.push(' Acción requerida:');
  if (violations.some(v => v.severity === 'CRITICAL')) {
    report.push('   ❌ CORREGIR violaciones CRÍTICAS antes de continuar.');
  }
  report.push('   Usa siempre: scripts/deploy-*.ps1 (no comandos sueltos)');
  report.push('═══════════════════════════════════════════════════════════════');
  return report.join('\n');
}

// ── Escáner de código fuente ───────────────────────────────────
function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const dir of CONFIG.EXCLUDE_DIRS) {
    if (normalized.includes(`/${dir}/`) || normalized.startsWith(`${dir}/`) || normalized.includes(`\\${dir}\\`)) {
      return true;
    }
  }
  return false;
}

function isAllowedFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return CONFIG.ALLOWED_FILES.some(allowed => normalized.endsWith(allowed));
}

function isAllowedLine(line) {
  const trimmed = line.trim();
  return CONFIG.ALLOWED_LINES.some(allowed => trimmed === allowed || trimmed.includes(allowed));
}

function scanDirectory(dirPath, baseDir) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      if (!isExcluded(relativePath)) {
        scanDirectory(fullPath, baseDir);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (CONFIG.INCLUDE_EXTENSIONS.includes(ext) && !isAllowedFile(relativePath)) {
        scanFile(fullPath, relativePath);
      }
    }
  }
}

function scanFile(filePath, relativePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isAllowedLine(line)) continue;

    for (const forbidden of CONFIG.FORBIDDEN_PATTERNS) {
      if (forbidden.pattern.test(line)) {
        addViolation(relativePath, forbidden.label, forbidden.severity, i + 1);
        break;
      }
    }
  }
}

function checkPipelineVersion() {
  const versionFile = path.join(__dirname, 'VERSION');
  if (fs.existsSync(versionFile)) {
    const localVersion = fs.readFileSync(versionFile, 'utf-8').trim();
    CONFIG.version = localVersion;
    try {
      const remoteResult = execSync(
        'git ls-remote origin HEAD 2>/dev/null || true',
        { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }
      ).trim();
      if (remoteResult) {
        const remoteHash = remoteResult.split('\t')[0];
        if (remoteHash) {
          const localHash = execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim();
          if (remoteHash !== localHash) {
            addWarning(`Pipeline desactualizado. Remoto: ${remoteHash.substring(0, 8)}. Ejecuta: git pull origin main`);
          }
        }
      }
    } catch {}
  }
}

function validateSession(sessionToken) {
  if (!sessionToken) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(' 🔒 GUARDIAN: ACCESO DENEGADO');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');
    console.error(' No se detectó GUARDIAN_SESSION válida.');
    console.error('');
    console.error(' Comandos directos NO autorizados. Usa los scripts PS1 oficiales:');
    console.error('');
    console.error('   📱 Android:   scripts/deploy-android.ps1');
    console.error('   🍎 iOS:       scripts/deploy-ios.ps1');
    console.error('   🌐 Gateway:   scripts/deploy-api-gateway.ps1');
    console.error('');
    process.exit(1);
  }

  const parts = sessionToken.split('-');
  if (parts.length < 2) {
    console.error(' 🔒 GUARDIAN: Token de sesión inválido.');
    process.exit(1);
  }

  const platform = parts[0];
  const timestamp = parseInt(parts[parts.length - 1], 10);

  if (isNaN(timestamp)) {
    console.error(' 🔒 GUARDIAN: Token de sesión corrupto.');
    process.exit(1);
  }

  const now = Date.now();
  if (now - timestamp > 3600000) {
    console.error(' 🔒 GUARDIAN: Sesión expirada (>1h). Re-ejecuta el script PS1.');
    process.exit(1);
  }

  return { platform, timestamp };
}

// ── Auditoría completa ─────────────────────────────────────────
function runAudit(sourceDirs) {
  console.log('');
  console.log(' 🔍 GUARDIAN: Escaneando código fuente...');
  console.log('');

  const baseDir = path.resolve(__dirname, '..');

  for (const dir of sourceDirs) {
    const fullDir = path.join(baseDir, dir);
    if (fs.existsSync(fullDir)) {
      scanDirectory(fullDir, baseDir);
    }
  }

  checkPipelineVersion();

  const report = generateReport();
  console.log(report);

  const hasCritical = violations.some(v => v.severity === 'CRITICAL');
  if (hasCritical) {
    console.error(' ❌ GUARDIAN: Violaciones CRÍTICAS detectadas. Build ABORTADO.');
    process.exit(1);
  }

  return { violations, warnings, hasCritical };
}

// ── CLI entry point ────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--strict') ? 'strict' :
               args.includes('--report') ? 'report' :
               args.includes('--intercept') ? 'intercept' : 'help';

  const sessionToken = process.env.GUARDIAN_SESSION;

  // Todos los proyectos a escanear
  const ALL_SOURCE_DIRS = [
    'apps-antojados/shared',
    'apps-antojados/apps',
    'explorer-app/src',
    'media-engine/src',
    '../Api_getaway_antojadosmx/src',
    '../atlx-antojados-gt/apps/explorer-api/src',
  ];

  switch (mode) {
    case 'intercept':
      if (!sessionToken) {
        validateSession(null);
        process.exit(1);
      }
      const session = validateSession(sessionToken);
      console.log(` ✅ Sesión ${session.platform} válida.`);
      runAudit(ALL_SOURCE_DIRS);
      console.log(' ✅ Auditoría superada. Build autorizado.');
      break;

    case 'strict':
      runAudit(ALL_SOURCE_DIRS);
      break;

    case 'report':
      runAudit(ALL_SOURCE_DIRS);
      break;

    case 'help':
    default:
      console.log('');
      console.log(' GUARDIAN — Interceptor de cumplimiento del contrato HTTP/Render');
      console.log('');
      console.log(' Modos de uso:');
      console.log('');
      console.log('   --intercept    Validar sesión + escanear (usado por scripts PS1)');
      console.log('   --strict       Solo escanear, falla si hay violaciones');
      console.log('   --report       Solo reporte, no falla');
      console.log('');
      console.log(' Variables de entorno:');
      console.log('   GUARDIAN_SESSION   Token de sesión (generado por scripts PS1)');
      console.log('');
      process.exit(0);
  }
}

main();