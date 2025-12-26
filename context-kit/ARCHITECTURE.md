# Architecture Guide

This document captures the high‑level architecture of the system and serves as a living reference for developers and reviewers. It defines the structural constraints and design principles that must be respected throughout development.

## Architectural Overview

Provide a concise description of the system's overall structure, such as whether it is a monolith, microservices or modular monolith. Describe the major components and how they communicate.

## Component Responsibilities

Detail the responsibilities of each major component or service. Explain how each part contributes to the product goals and how they collaborate.

## Design Principles

Document the architectural principles that guide design decisions. Examples include separation of concerns, single responsibility, favour composition over inheritance and designing for change.

## Data Flow

Explain how data moves through the system. Include diagrams or tables that illustrate key data paths and storage.

## Technology Stack

List the primary technologies, frameworks and programming languages used. Include versions and rationale for their selection.

## Non‑Functional Requirements

Outline non‑functional requirements such as performance targets, scalability expectations, security considerations, reliability and observability.

## Architectural Decision Records (ADR)

Link to or summarise important ADRs. Each ADR should document the context, decision, consequences and alternatives. Use the `propose-adr.prompt.md` when adding new ADRs.

## Extensibility and Maintenance

Describe how the architecture accommodates future changes. Discuss patterns for adding new modules, services or capabilities without violating the core design principles.
