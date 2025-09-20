/* Environment audit: OS, CPU, memory, disk, tools. Outputs docs/environment_report.md */
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function check(cmd) {
    const res = spawnSync('bash', ['-lc', cmd], { encoding: 'utf8' });
    if (res.status === 0) return res.stdout.trim();
    return 'not found';
}

function runAudit(root = process.cwd()) {
    const lines = [];
    lines.push(`# Environment Report`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(`## System`);
    lines.push(`OS: ${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`);
    lines.push(`CPUs: ${os.cpus().length}`);
    lines.push(`Total Memory: ${Math.round(os.totalmem() / 1e9)} GB`);
    lines.push('');
    lines.push('## Tools');
    lines.push(`node: ${check('node -v || true')}`);
    lines.push(`pnpm: ${check('pnpm -v || true')}`);
    lines.push(`docker: ${check('docker --version || true')}`);
    lines.push(`podman: ${check('podman --version || true')}`);
    lines.push(`python: ${check('python3 --version || true')}`);
    lines.push('');
    const outFile = path.join(root, 'docs', 'environment_report.md');
    fs.writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');
    return outFile;
}

if (require.main === module) {
    const file = runAudit();
    console.log(`[env] Wrote ${file}`);
}

module.exports = { runAudit };
