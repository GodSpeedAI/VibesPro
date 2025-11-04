# Copier Questions Refinement - Layman-Friendly Version

## Overview

This document describes the improvements made to `copier.yml` to make it accessible to non-technical users while maintaining all functionality.

## Problems with Original Questions

### 1. Technical Jargon

-   **Before:** "Project slug (kebab-case, used for directories)"
-   **Issue:** Non-developers don't know what "kebab-case" or "slug" means

### 2. No Context or Examples

-   **Before:** "Primary domain contexts (comma-separated)"
-   **Issue:** Users don't know what to enter or why it matters

### 3. Unclear Consequences

-   **Before:** "Include AI-enhanced development workflows"
-   **Issue:** Users don't understand what they'll get or lose

### 4. Missing Guidance for Defaults

-   **Before:** Questions with defaults but no explanation of when to change them
-   **Issue:** Users don't know if they should accept or customize

## Improvements Made

### 1. Clear Section Organization

Organized questions into logical sections that match user mental models:

```
SECTION 1: Basic Project Information (Who & What)
SECTION 2: What Does Your Project Do? (Purpose)
SECTION 3: What Should Your App Be Called Internally? (Domain naming)
SECTION 4: Technology Choices (Pick What You Know!)
SECTION 5: AI-Powered Development Features (Optional but Recommended!)
SECTION 6: Code Structure Options (Advanced - Safe to Use Defaults)
SECTION 7: Security Features (Advanced - Optional)
```

### 2. Friendly Language with Explanations

**Before:**

```yaml
project_slug:
    type: str
    help: "Project slug (kebab-case, used for directories)"
```

**After:**

```yaml
project_slug:
    type: str
    help: |
        What's the technical name for your project?

        This will be used in folder names and URLs. It should be lowercase with dashes.
        We've suggested one based on your project name - you can use it or change it.

        Examples:
        - "my-task-manager" (good)
        - "customer-portal" (good)
        - "My App" (bad - has spaces and capitals)
    placeholder: "my-awesome-app"
```

### 3. Concrete Examples for Every Question

Every question now includes:

-   **What it is** (plain English explanation)
-   **Why it matters** (what it's used for)
-   **Examples** (good and bad examples where applicable)
-   **When to change it** (guidance on defaults)

**Example:**

```yaml
project_purpose:
    help: |
        What does this project do? (In plain English)

        Describe what your app is for in 1-2 sentences. Imagine explaining it to a friend.

        Examples:
        - "A task manager that helps teams organize their work"
        - "An online store for selling handmade crafts"
        - "A customer relationship management system for small businesses"
    placeholder: "A task manager that helps teams organize their work and track progress"
```

### 4. Better Choice Descriptions

**Before:**

```yaml
app_framework:
    choices:
        - next
        - remix
        - expo
```

**After:**

```yaml
app_framework:
    choices:
        Next.js (Websites & web apps - recommended): next
        Remix (Fast modern websites): remix
        Expo (Mobile apps for iOS & Android): expo
```

### 5. Clear Recommendations

Added explicit recommendations for common scenarios:

```yaml
architecture_style:
    help: |
        ...
        If unsure, choose "hexagonal" - it's the most flexible and maintainable.
```

### 6. "When to Use" Guidance

For advanced features, added clear criteria:

```yaml
enable_security_hardening:
    help: |
        Choose "yes" if:
        - You're handling medical records, financial data, or personal information
        - You need compliance with strict security regulations

        Choose "no" for:
        - Internal tools
        - Public websites without sensitive data
        - Learning projects
```

### 7. Friendly Error Messages

**Before:**

```yaml
validator: "{% if not project_slug.replace('-', '').isalnum() %}Invalid project slug{% endif %}"
```

**After:**

```yaml
validator: "{% if not project_slug.replace('-', '').isalnum() %}Project slug must contain only letters, numbers, and dashes (no spaces or special characters){% endif %}"
```

### 8. Progressive Disclosure

Questions are ordered from simple to advanced:

-   Basic information comes first
-   Technical details are marked "(Advanced)"
-   Optional features are clearly labeled
-   Advanced options explain when to skip them

## Specific Improvements by Section

### Basic Project Information

-   ✅ Plain language explanations
-   ✅ Concrete examples for project naming
-   ✅ Email validation with friendly error
-   ✅ Automatic slug generation explained

### Project Purpose

-   ✅ "Explain to a friend" framing
-   ✅ Three diverse, concrete examples
-   ✅ Clear placeholder text

### Domain Configuration

-   ✅ Explained "business area" instead of "domain"
-   ✅ Guidance on when to use multiple domains
-   ✅ Permission to skip if unsure

### Technology Choices

-   ✅ Each framework explained in user terms
-   ✅ Clear use cases for each option
-   ✅ Explicit recommendations
-   ✅ "If you're building X, choose Y" guidance

### AI Features

-   ✅ Explained benefits in concrete terms
-   ✅ "Like having an assistant" analogy
-   ✅ Clear recommendation (YES) with reasoning
-   ✅ When to choose NO

### Advanced Code Structure

-   ✅ Labeled as "Advanced"
-   ✅ Explained what each option does
-   ✅ Safe defaults provided
-   ✅ Guidance on when to change

### Security Features

-   ✅ Clearly marked optional
-   ✅ Specific use cases listed
-   ✅ "Most projects can skip this" reassurance
-   ✅ Compliance context provided

## Best Practices Applied

### 1. Conversational Tone

-   Uses "we" and "you" pronouns
-   Asks questions naturally
-   Sounds like a helpful guide, not a form

### 2. No Assumptions

-   Defines all technical terms
-   Provides context for every choice
-   Explains consequences clearly

### 3. Confidence Building

-   "Don't worry" reassurances where appropriate
-   "If unsure" guidance provided
-   Clear defaults with explanations

### 4. Safety Rails

-   Bad examples shown alongside good ones
-   Validator errors are helpful, not cryptic
-   Advanced options clearly marked

### 5. Learning Path

-   Simple questions first
-   Complexity increases gradually
-   Advanced sections can be skipped
-   References to documentation where needed

## Technical Debt Prevention

### No Functionality Removed

-   ✅ All original questions preserved
-   ✅ All validators intact
-   ✅ All conditional logic maintained
-   ✅ All defaults preserved

### Maintained Compatibility

-   ✅ Same variable names
-   ✅ Same types
-   ✅ Same validation rules
-   ✅ Same conditional dependencies

### No New Dependencies

-   ✅ Pure YAML improvements
-   ✅ No new libraries required
-   ✅ No changes to hooks
-   ✅ No changes to templates

### Testability Preserved

-   ✅ Can still use data files
-   ✅ Validator logic unchanged
-   ✅ Default values still work
-   ✅ Automation still possible

## Testing the Improvements

### Test Cases

1. **Complete Beginner**

    - Can understand every question
    - Knows what to enter
    - Confident using defaults
    - Successful generation

2. **Non-Technical User**

    - Skips advanced options confidently
    - Makes informed technology choices
    - Understands what they're building
    - Happy with results

3. **Technical User**

    - Still gets all advanced options
    - Can customize everything
    - Appreciates clear organization
    - Faster completion time

4. **Edge Cases**
    - Invalid input → helpful error message
    - Skipped optional fields → works fine
    - All defaults → works perfectly
    - All customizations → validates correctly

### Validation

Run the same test suite as before:

```bash
# Test with defaults
copier copy . /tmp/test-default --defaults --trust

# Test with custom data
copier copy . /tmp/test-custom --data-file tests/fixtures/test-data.yml --trust

# Test interactive mode (manual)
copier copy . /tmp/test-interactive
```

## Migration Guide

### For Maintainers

**Replacing the current file:**

```bash
# Backup current version
cp copier.yml copier.yml.backup

# Replace with improved version
mv copier.yml.improved copier.yml

# Test
just test-generation
```

### For Users

**No changes needed!**

-   Existing data files still work
-   Automation scripts unchanged
-   Same variables, better questions

### For Documentation

Update the following docs to reference improved questions:

-   `docs/wiki/v2/1.md` - Copier chapter
-   `docs/knowledgebase/how-to/` - Any Copier guides
-   `README.md` - Quick start section

## Examples of Common User Journeys

### Journey 1: "I want to build a web app"

**Questions they'll confidently answer:**

1. ✅ Project name: "My Task Manager"
2. ✅ Purpose: "A task manager for small teams"
3. ✅ Framework: Next.js (websites - recommended)
4. ✅ Backend: FastAPI (modern & fast - recommended)
5. ✅ Database: PostgreSQL (professional - recommended)
6. ✅ AI workflows: Yes (makes development easier)
7. ⏭️ Skip advanced options (use defaults)

**Result:** Working project in minutes

### Journey 2: "I want to build a mobile app"

**Questions they'll confidently answer:**

1. ✅ Project name: "Fitness Tracker"
2. ✅ Purpose: "Mobile app for tracking workouts"
3. ✅ Framework: Expo (mobile apps for iOS & Android)
4. ✅ Backend: FastAPI (recommended)
5. ✅ Database: PostgreSQL (recommended)
6. ✅ AI workflows: Yes
7. ⏭️ Skip advanced options

**Result:** Mobile app scaffold ready to go

### Journey 3: "I'm a developer migrating a project"

**Questions they'll customize:**

1. ✅ Project name: "Legacy CRM Migration"
2. ✅ Purpose: "CRM system rewrite"
3. ✅ Domain: "crm" (custom)
4. ✅ Framework: Next.js with Pages Router (compatibility)
5. ✅ Backend: Django (needed for admin panel)
6. ✅ Multiple domains: "users,contacts,sales,billing"
7. ✅ Customize advanced options as needed

**Result:** Properly structured migration project

## Feedback Integration

### Common Questions Anticipated

**Q: "What if I'm not sure what to choose?"**
A: Every question now has a recommended default with explanation.

**Q: "What does this technical term mean?"**
A: All technical terms are now explained in plain English.

**Q: "Will I break something if I choose wrong?"**
A: Each question explains consequences and provides safe defaults.

**Q: "Can I change this later?"**
A: Documentation now clarifies which choices are easy to change vs. locked in.

### Future Improvements

Based on user feedback, we can add:

1. Interactive tutorial mode (wizard with categories)
2. Project templates (e.g., "E-commerce", "SaaS", "Internal Tool")
3. Visual examples (screenshots of what you'll get)
4. "Why this matters" expandable sections
5. Video walkthrough references

## Summary

**Before:**

-   Technical jargon throughout
-   No examples
-   Unclear consequences
-   Intimidating for beginners

**After:**

-   ✅ Plain English everywhere
-   ✅ Concrete examples for every question
-   ✅ Clear recommendations
-   ✅ Confidence-building guidance
-   ✅ Organized by user mental model
-   ✅ Advanced options clearly marked
-   ✅ No functionality lost
-   ✅ No technical debt added

**Result:** A configuration that's accessible to everyone while maintaining professional power for experts.
