import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();
const jsFiles = ['site.js', 'member-auth.js', 'photo-editor.js'];
const failures = [];
let inlineScriptCount = 0;

for (const file of jsFiles) {
  try {
    new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) failures.push(`${file}: duplicate IDs: ${duplicates.join(', ')}`);

  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    inlineScriptCount += 1;
    try {
      new vm.Script(match[2], { filename: `${file} inline script` });
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/g)) {
    const target = match[1];
    if (/^(?:https?:|data:|mailto:|tel:|javascript:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root, target))) failures.push(`${file}: missing local file ${target}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Site check passed: ${htmlFiles.length} HTML pages, ${inlineScriptCount} inline scripts, and ${jsFiles.length} JavaScript files.`);
