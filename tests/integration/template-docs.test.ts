import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Template documentation tokens', () => {
    const templateRoot = join(process.cwd(), 'templates', '{{project_slug}}');
    const docsRoot = join(templateRoot, 'docs');

    it('README template exposes cookiecutter metadata placeholders', () => {
        const readmePath = join(templateRoot, 'README.md.j2');
        const readme = readFileSync(readmePath, 'utf8');

        expect(readme).toContain('cookiecutter.project_name');
        expect(readme).toContain('cookiecutter.project_slug');
        expect(readme).toContain('cookiecutter.author_name');
        expect(readme).toContain('cookiecutter.repo_url');
        expect(readme).toContain('cookiecutter.year');
    });

    it('maintainer docs include project metadata tokens for repo alignment', () => {
        const docs = [
            'dev_adr.md.j2',
            'dev_prd.md.j2',
            'dev_sds.md.j2',
            'dev_technical-specifications.md.j2'
        ];

        docs.forEach((fileName) => {
            const target = readFileSync(join(docsRoot, fileName), 'utf8');
            expect(target).toContain('cookiecutter.project_name');
            expect(target).toContain('cookiecutter.project_slug');
            expect(target).toContain('cookiecutter.author_name');
            expect(target).toContain('cookiecutter.repo_url');
            expect(target).toContain('cookiecutter.year');
        });
    });
});
