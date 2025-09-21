import { runGenerator } from './tests/generators/utils.ts';

async function debug() {
    console.log('=== Running debug test ===');

    const result = await runGenerator('project', {
        project_name: 'Debug Test',
        app_framework: 'next',
        app_name: 'debug-app',
        app_domains: ['user-management'],
    });

    console.log('=== Results ===');
    console.log('Success:', result.success);
    console.log('Total files:', result.files.length);

    if (result.errorMessage) {
        console.log('Error message:', result.errorMessage);
    }

    console.log('\n=== First 20 files ===');
    result.files.slice(0, 20).forEach((f, i) => console.log(`${i + 1}. ${f}`));

    console.log('\n=== App files ===');
    const appFiles = result.files.filter(f => f.startsWith('apps/'));
    console.log('App files count:', appFiles.length);
    appFiles.forEach(f => console.log(`  - ${f}`));

    console.log('\n=== Expected file checks ===');
    console.log('Has debug-app pages/index.tsx:', result.files.includes('apps/debug-app/pages/index.tsx'));
    console.log('Has debug-app lib/api-client.ts:', result.files.includes('apps/debug-app/lib/api-client.ts'));

    console.log('\n=== Output path ===');
    console.log('Path:', result.outputPath);
}

debug().catch(console.error);
