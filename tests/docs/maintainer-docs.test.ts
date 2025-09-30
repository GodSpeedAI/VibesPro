import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Maintainer doc templates', () => {
    const templateRoot = join(process.cwd(), 'templates', '{{project_slug}}');
    const docsRoot = join(templateRoot, 'docs');

    const templateFiles = [
        'dev_adr.md.j2',
        'dev_prd.md.j2',
        'dev_sds.md.j2',
        'dev_technical-specifications.md.j2'
    ];

    it('exposes maintainer docs as non-empty Jinja2 templates with cookiecutter tokens', () => {
        templateFiles.forEach((fileName) => {
            const target = join(docsRoot, fileName);
            expect(existsSync(target)).toBe(true);

            const contents = readFileSync(target, 'utf8');
            expect(contents.trim().length).toBeGreaterThan(0);
            expect(contents).toContain('cookiecutter.project_name');
            expect(contents).toContain('cookiecutter.project_slug');
            expect(contents).toContain('cookiecutter.author_name');
        });
    });
});
