"""Unit tests for HexDDD migrator template conversion functions."""

import pytest
from pathlib import Path
import tempfile
from unittest.mock import Mock, patch
from tools.migration.hexddd_migrator import HexDDDMigrator
from tools.migration.hexddd_analyzer import GeneratorInfo


class TestConvertCodeToTemplate:
    """Test _convert_code_to_template method with various code patterns."""

    def setup_method(self):
        """Set up test migrator instance."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.migrator = HexDDDMigrator(self.temp_dir)

    def test_domain_name_replacement(self):
        """Test basic domain name replacement."""
        input_code = """
import { UserEntity } from './user-entity';
import { userDomain } from '../user-domain';

export class UserService {
    constructor(private userRepo: UserRepository) {}
}
"""
        expected_output = """
import { UserEntity } from './user-entity';
import { {{domain_name}} } from '../{{domain_name}}';

export class UserService {
    constructor(private userRepo: UserRepository) {}
}
"""
        result = self.migrator._convert_code_to_template(input_code, "userDomain")
        assert result == expected_output

    def test_entity_class_name_templating(self):
        """Test entity class name pattern replacement."""
        input_code = """
export class UserEntity {
    constructor(public id: UserId) {}
}

export class ProductEntity implements Entity {
    validate(): boolean { return true; }
}

export class OrderItemEntity extends BaseEntity {
    // implementation
}
"""
        expected_output = """
export class {{entity_name}}Entity {
    constructor(public id: UserId) {}
}

export class {{entity_name}}Entity implements Entity {
    validate(): boolean { return true; }
}

export class {{entity_name}}Entity extends BaseEntity {
    // implementation
}
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_service_class_name_templating(self):
        """Test service class name pattern replacement."""
        input_code = """
export class UserService {
    async createUser(data: CreateUserData): Promise<User> {
        return this.userRepo.save(new User(data));
    }
}

export class PaymentService extends BaseService {
    processPayment(): void {}
}

export class NotificationService implements IService {
    sendNotification(): void {}
}
"""
        expected_output = """
export class {{entity_name}}Service {
    async createUser(data: CreateUserData): Promise<User> {
        return this.userRepo.save(new User(data));
    }
}

export class {{entity_name}}Service extends BaseService {
    processPayment(): void {}
}

export class {{entity_name}}Service implements IService {
    sendNotification(): void {}
}
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_repository_class_name_templating(self):
        """Test repository class name pattern replacement."""
        input_code = """
export class UserRepository implements IUserRepository {
    async findById(id: string): Promise<User | null> {
        return this.db.user.findUnique({ where: { id } });
    }
}

export class ProductRepository extends BaseRepository<Product> {
    findByCategory(category: string): Promise<Product[]> {
        return this.find({ category });
    }
}
"""
        expected_output = """
export class {{entity_name}}Repository implements IUserRepository {
    async findById(id: string): Promise<User | null> {
        return this.db.user.findUnique({ where: { id } });
    }
}

export class {{entity_name}}Repository extends BaseRepository<Product> {
    findByCategory(category: string): Promise<Product[]> {
        return this.find({ category });
    }
}
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_import_path_templating_entity_references(self):
        """Test import path templating for entity-related imports."""
        input_code = """
import { UserEntity } from './user-entity';
import { UserService } from './services/user-service';
import { UserRepository } from './repositories/user-repository';
import { ProductEntity } from './product-entity';
import { PaymentService } from './payment-service';
import { ConfigService } from './config'; // Should NOT be templated
import { Logger } from '../utils/logger'; // Should NOT be templated
"""
        expected_output = """
import { UserEntity } from './{{entity_name}}';
import { UserService } from './{{entity_name}}';
import { UserRepository } from './{{entity_name}}';
import { ProductEntity } from './{{entity_name}}';
import { PaymentService } from './{{entity_name}}';
import { ConfigService } from './config'; // Should NOT be templated
import { Logger } from '../utils/logger'; // Should NOT be templated
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_case_insensitive_import_matching(self):
        """Test case-insensitive matching for imports."""
        input_code = """
import { User } from './USER-ENTITY';
import { Service } from './payment-SERVICE';
import { Repo } from './user-REPOSITORY';
import { Config } from './config-utils'; // Should NOT be templated
"""
        expected_output = """
import { User } from './{{entity_name}}';
import { Service } from './{{entity_name}}';
import { Repo } from './{{entity_name}}';
import { Config } from './config-utils'; // Should NOT be templated
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_camel_case_class_names(self):
        """Test multi-word camelCase class names."""
        input_code = """
export class UserAccountEntity {
    constructor(public id: string) {}
}

export class PaymentProcessorService {
    processPayment(): void {}
}

export class CustomerDataRepository {
    findCustomers(): Promise<Customer[]> { return []; }
}
"""
        expected_output = """
export class {{entity_name}}Entity {
    constructor(public id: string) {}
}

export class {{entity_name}}Service {
    processPayment(): void {}
}

export class {{entity_name}}Repository {
    findCustomers(): Promise<Customer[]> { return []; }
}
"""
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        assert result == expected_output

    def test_mixed_patterns_comprehensive(self):
        """Test comprehensive mixed patterns in a realistic code sample."""
        input_code = """
import { UserAccountEntity } from './user-account-entity';
import { UserService } from './services/user-service';
import { DatabaseRepository } from './repository';
import { Logger } from '../utils/logger';

export class UserAccountEntity implements DomainEntity {
    constructor(
        public readonly id: UserAccountId,
        private readonly email: Email
    ) {}

    validate(): ValidationResult {
        return this.email.isValid() ? ValidationResult.success() : ValidationResult.failure();
    }
}

export class UserAccountService {
    constructor(
        private readonly userRepo: UserAccountRepository,
        private readonly logger: Logger
    ) {}

    async createAccount(email: string): Promise<UserAccountEntity> {
        const entity = new UserAccountEntity(
            UserAccountId.generate(),
            Email.create(email)
        );

        await this.userRepo.save(entity);
        this.logger.info('User account created');

        return entity;
    }
}

export class UserAccountRepository extends BaseRepository<UserAccountEntity> {
    async findByEmail(email: string): Promise<UserAccountEntity | null> {
        return this.findOne({ email });
    }
}
"""
        expected_output = """
import { UserAccountEntity } from './{{entity_name}}';
import { UserService } from './{{entity_name}}';
import { DatabaseRepository } from './{{entity_name}}';
import { Logger } from '../utils/logger';

export class {{entity_name}}Entity implements DomainEntity {
    constructor(
        public readonly id: UserAccountId,
        private readonly email: Email
    ) {}

    validate(): ValidationResult {
        return this.email.isValid() ? ValidationResult.success() : ValidationResult.failure();
    }
}

export class {{entity_name}}Service {
    constructor(
        private readonly userRepo: UserAccountRepository,
        private readonly logger: Logger
    ) {}

    async createAccount(email: string): Promise<UserAccountEntity> {
        const entity = new UserAccountEntity(
            UserAccountId.generate(),
            Email.create(email)
        );

        await this.userRepo.save(entity);
        this.logger.info('User account created');

        return entity;
    }
}

export class {{entity_name}}Repository extends BaseRepository<UserAccountEntity> {
    async findByEmail(email: string): Promise<UserAccountEntity | null> {
        return this.findOne({ email });
    }
}
"""
        result = self.migrator._convert_code_to_template(input_code, "userAccount")
        assert result == expected_output

    def test_no_unwanted_replacements(self):
        """Test that unrelated classes are not replaced."""
        input_code = """
export class ConfigService {
    getConfig(): Config { return {}; }
}

export class DatabaseConnection {
    connect(): void {}
}

export class EntityFactory {
    createEntity(): Entity { return new Entity(); }
}

export class ServiceLocator {
    getService(): Service { return new Service(); }
}

export class RepositoryManager {
    getRepository(): Repository { return new Repository(); }
}
"""
        # These should NOT be templated because they don't match our specific patterns
        # (ConfigService, DatabaseConnection, etc. don't end with Entity/Service/Repository)
        result = self.migrator._convert_code_to_template(input_code, "test-domain")
        # Should be unchanged since none match the specific Entity/Service/Repository suffix patterns
        assert result == input_code


class TestConvertGeneratorFile:
    """Test _convert_generator_file method with various TypeScript generator patterns."""

    def setup_method(self):
        """Set up test migrator instance and mock generator."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.migrator = HexDDDMigrator(self.temp_dir)
        self.template_dir = self.temp_dir / "templates" / "test-generator"
        self.template_dir.mkdir(parents=True)

    def _create_mock_generator(self, content: str) -> GeneratorInfo:
        """Create a mock generator with specified content."""
        generator_file = self.temp_dir / "generator.ts"
        generator_file.write_text(content)

        mock_generator = Mock(spec=GeneratorInfo)
        mock_generator.name = "test-generator"
        mock_generator.generator_file = generator_file
        mock_generator.path = self.temp_dir
        mock_generator.template_files = []

        return mock_generator

    def test_simple_function_detection(self):
        """Test detection of exported functions."""
        ts_content = """
export function generateEntity(options: GeneratorOptions): void {
    console.log('Generating entity');
}

function helperFunction(name: string): string {
    return `processed-${name}`;
}

export function createFiles(context: any): void {
    // implementation
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        assert generated_file.exists()

        content = generated_file.read_text()

        # Should detect exported functions
        assert "# Detected functions in original generator:" in content
        assert "# - generateEntity(" in content
        assert "# - createFiles(" in content
        assert "# - helperFunction(" in content  # Should detect non-exported functions too

    def test_writefilesync_detection_and_conversion(self):
        """Test detection and conversion of writeFileSync calls."""
        ts_content = """
import { writeFileSync } from 'fs';

export function generateEntity(options: any): void {
    const entityContent = `
export class ${options.name}Entity {
    constructor(public id: string) {}
}`;

    writeFileSync(`${options.outputDir}/${options.name}.entity.ts`, entityContent);

    fs.writeFileSync('config.json', '{"version": "1.0.0"}');
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        content = generated_file.read_text()

        # Should detect write operations
        assert "# Detected write operations" in content
        assert "write op 0:" in content
        assert "write op 1:" in content

        # Should generate proper Python file writing code
        assert "filename_0 = output_dir /" in content
        assert "filename_1 = output_dir /" in content
        assert ".write_text(" in content

    def test_template_literal_conversion(self):
        """Test conversion of template literals."""
        ts_content = """
export function generateComponent(options: ComponentOptions): void {
    const componentTemplate = `
import { Component } from '@angular/core';

@Component({
  selector: '${options.selector}',
  template: \`
    <div class="${options.className}">
      <h1>${options.title}</h1>
    </div>
  \`
})
export class ${options.name}Component {
  title = '${options.title}';
}`;

    writeFileSync(\`\${options.path}/\${options.name}.component.ts\`, componentTemplate);
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        content = generated_file.read_text()

        # Should convert ${variable} to {variable} format
        assert "{selector}" in content
        assert "{className}" in content
        assert "{name}" in content
        assert "{title}" in content

        # Should use the _render_template helper
        assert "_render_template(" in content

    def test_no_write_operations_fallback(self):
        """Test fallback when no write operations are detected."""
        ts_content = """
export function validateOptions(options: any): boolean {
    return options.name && options.name.length > 0;
}

function logMessage(message: string): void {
    console.log(message);
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        content = generated_file.read_text()

        # Should indicate no automatic generation
        assert "No automatic file generation detected" in content
        assert "please migrate logic manually" in content

    def test_template_literals_without_writefilesync(self):
        """Test handling template literals when no writeFileSync is present."""
        ts_content = """
export function buildTemplate(options: any): string {
    return \`
export class \${options.name}Entity {
    constructor(public id: \${options.idType}) {}

    getName(): string {
        return '\${options.name}';
    }
}\`;
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        content = generated_file.read_text()

        # Should create sample files from template literals
        assert "template literals exist - create sample files" in content
        assert "sample_0 = output_dir /" in content
        assert "test-generator_sample_0.txt" in content
        assert "_render_template(" in content

    def test_complex_generator_with_multiple_patterns(self):
        """Test complex generator with multiple patterns."""
        ts_content = """
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export function generateDomainEntity(options: EntityOptions): void {
    validateOptions(options);

    const entityTemplate = \`
import { Entity } from '../base/entity';
import { \${options.name}Id } from './\${options.name.toLowerCase()}-id';

export class \${options.name}Entity extends Entity<\${options.name}Id> {
    constructor(
        id: \${options.name}Id,
        private readonly name: string,
        private readonly email: string
    ) {
        super(id);
    }

    getName(): string {
        return this.name;
    }

    getEmail(): string {
        return this.email;
    }

    validate(): boolean {
        return this.name.length > 0 && this.email.includes('@');
    }
}\`;

    const repositoryTemplate = \`
import { Repository } from '../base/repository';
import { \${options.name}Entity } from './\${options.name.toLowerCase()}-entity';

export class \${options.name}Repository extends Repository<\${options.name}Entity> {
    async findByEmail(email: string): Promise<\${options.name}Entity | null> {
        return this.findOne({ email });
    }
}\`;

    // Create output directory
    mkdirSync(options.outputDir, { recursive: true });

    // Write entity file
    writeFileSync(
        join(options.outputDir, \`\${options.name.toLowerCase()}-entity.ts\`),
        entityTemplate
    );

    // Write repository file
    writeFileSync(
        \`\${options.outputDir}/\${options.name.toLowerCase()}-repository.ts\`,
        repositoryTemplate
    );
}

function validateOptions(options: EntityOptions): void {
    if (!options.name) {
        throw new Error('Entity name is required');
    }
}

export function generateValueObject(options: ValueObjectOptions): void {
    // Another generator function
}
"""
        generator = self._create_mock_generator(ts_content)
        self.migrator._convert_generator_file(generator, self.template_dir)

        generated_file = self.template_dir / "generator.py"
        content = generated_file.read_text()

        # Should detect multiple functions
        assert "# - generateDomainEntity(" in content
        assert "# - validateOptions(" in content
        assert "# - generateValueObject(" in content

        # Should detect multiple write operations
        assert "write op 0:" in content
        assert "write op 1:" in content

        # Should convert template syntax
        assert "{name}" in content
        assert "{outputDir}" in content

        # Should use proper Python constructs
        assert "output_dir.mkdir(parents=True, exist_ok=True)" in content
        assert "_render_template(" in content

        # Should generate functional Python code structure
        assert "def generate(context: Dict[str, Any], output_dir: Path) -> None:" in content
        assert "from pathlib import Path" in content
        assert "from typing import Dict, Any" in content
