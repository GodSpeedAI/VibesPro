# vibes-pro

Unified generator-first platform combining HexDDD and VibePDK

## Getting Started

This project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns.

### Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd vibes-pro
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
- **user**: Core business domain
- **billing**: Core business domain

## Technology Stack

### Frameworks

- next
- fastapi

### AI-Enhanced Features

This project includes AI-enhanced development workflows for:

- Automated code generation
- Architecture pattern suggestions
- Development assistance

## Development

```bash
just setup    # Setup project
just dev      # Run development server
just build    # Build for production
just test     # Run tests
```

## Journeys

- [Developer & User Journeys](guides/developer-user-journeys.md)

## Plans

- [Production Readiness Plan](plans/production-readiness/2025-12-27-production-readiness.md)

## License

MIT License
