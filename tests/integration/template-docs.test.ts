import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Template documentation tokens', () => {
    const templateRoot = join(process.cwd(), 'templates', '{{project_slug}}');
    const docsRoot = join(templateRoot, 'docs');

    it('README template exposes Copier metadata placeholders', () => {
        const readmePath = join(templateRoot, 'README.md.j2');
        const readme = readFileSync(readmePath, 'utf8');

        expect(readme).toContain('project_name');
        expect(readme).toContain('project_slug');
        expect(readme).toContain('author_name');
        expect(readme).toContain('repo_url');
        expect(readme).toContain('year');
    });

    it('maintainer docs include project metadata tokens for repo alignment', () => {
        const docs = [
            'adr.md.j2',
            'prd.md.j2',
            'sds.md.j2',
            'technical-specifications.md.j2'
        ];

        docs.forEach((fileName) => {
            const target = readFileSync(join(docsRoot, 'specs', fileName), 'utf8');
            // Files use the metadata header partial which contains Copier variables
            expect(target).toContain("{% include 'docs/partials/_metadata_header.j2' %}");
        });

        // Verify the partial itself contains all required Copier variables
        const partialPath = join(docsRoot, 'specs', 'partials', '_metadata_header.j2');
        const partialContents = readFileSync(partialPath, 'utf8');
        expect(partialContents).toContain('project_name');
        expect(partialContents).toContain('project_slug');
        expect(partialContents).toContain('author_name');
        expect(partialContents).toContain('repo_url');
        expect(partialContents).toContain('year');
    });
});
