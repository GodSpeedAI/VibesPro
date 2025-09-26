# testproj

A modern application built with hexagonal architecture

## Getting Started

This project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns.

### Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd testproj
just setup
just dev
```

## Architecture

This project implements **Hexagonal Architecture** with **Domain-Driven Design**:

- **Domain Layer**: Pure business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External adapters and implementations
- **Interface Layer**: Controllers, views, and user interfaces

### Domains

- **core**: Core business domain

## Technology Stack

### Frameworks

- next
## Development

```bash
just setup    # Setup project
just dev      # Run development server
just build    # Build for production
just test     # Run tests
```

## License

MIT License
