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

    it('exposes maintainer docs as non-empty Jinja2 templates with Copier variables', () => {
        templateFiles.forEach((fileName) => {
            const target = join(docsRoot, fileName);
            expect(existsSync(target)).toBe(true);

            const contents = readFileSync(target, 'utf8');
            expect(contents.trim().length).toBeGreaterThan(0);
            // Files use the metadata header partial which contains Copier variables
             expect(contents).toContain("{% include project_slug ~ '/docs/partials/_metadata_header.j2' %}");
        });

        // Verify the partial itself contains all required Copier variables
        const partialPath = join(docsRoot, 'partials', '_metadata_header.j2');
        expect(existsSync(partialPath)).toBe(true);
        const partialContents = readFileSync(partialPath, 'utf8');
        expect(partialContents).toContain('project_name');
        expect(partialContents).toContain('project_slug');
        expect(partialContents).toContain('author_name');
        expect(partialContents).toContain('repo_url');
        expect(partialContents).toContain('year');
    });
});
