import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', 'src', 'content', 'blog');

const list = (locale) =>
  new Set(readdirSync(join(root, locale)).filter((f) => f.endsWith('.md')));

const en = list('en');
const zh = list('zh');

let warnings = 0;
for (const f of en) {
  if (!zh.has(f)) {
    console.log(`::warning::Post "${f}" exists in en/ but has no zh/ counterpart`);
    warnings++;
  }
}
for (const f of zh) {
  if (!en.has(f)) {
    console.log(`::warning::Post "${f}" exists in zh/ but has no en/ counterpart`);
    warnings++;
  }
}

console.log(
  warnings === 0
    ? `All ${en.size} posts are paired in en/ and zh/`
    : `${warnings} unpaired post(s) found (warning only, not blocking)`
);
