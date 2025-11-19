# Quick Start Guide: Creating Your First VibesPro Project

**For people who've never used this before!**

## What is This?

VibesPro is a project generator that creates a complete, professional application for you. Think of it like a "create new document" wizard, but instead of a blank page, you get:

- ✅ A fully structured codebase
- ✅ AI-powered development tools
- ✅ Best practices built-in
- ✅ Documentation included
- ✅ Ready to customize and build

## Before You Start

### What You Need

- A computer (Mac, Windows, or Linux)
- Basic familiarity with the command line (Terminal/Command Prompt)
- An idea of what you want to build

### Optional: Python dev tools for local validation

If you want to run the repository's type checks and linters locally (recommended for contributors), install the Python dev tools used by this repo:

```bash
# Create a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate

# Install dev tooling
pip install mypy ruff shellcheck
```

After this, `pnpm run typecheck` will invoke `mypy .` and report issues locally.

### Recommended: Python dev tools (best practice)

For consistent local development and CI parity we recommend creating a per-repo virtual environment and installing the project's checking tools there. This avoids contaminating your global Python environment and ensures everyone runs the same tool versions.

1. Create and activate a virtual environment in the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Upgrade packaging tools and install the recommended dev tools (mypy will install missing stubs when possible):

```bash
python -m pip install --upgrade pip setuptools wheel
pip install mypy ruff shellcheck types-requests types-PyYAML types-colorama tiktoken
```

3. Run the workspace typecheck and validation commands:

```bash
pnpm run typecheck   # runs tools/check_mypy.sh -> mypy --install-types --non-interactive .
just ai-validate     # runs pre-commit checks, linters, typecheck and tests
```

Notes:

- The project includes a helper `tools/check_mypy.sh` which prefers `.venv/bin/mypy` when present and falls back to PATH mypy. Using the `.venv` created above ensures consistent results.
- `mypy --install-types` will attempt to fetch type stubs automatically when pip is available in the venv. If network access is restricted, install the listed type packages manually.
- Consider adding `.venv/` to your global `~/.gitignore` or the repo `.gitignore` to avoid checking the venv into source control.

### What You DON'T Need

- Deep programming knowledge
- Understanding of complex architecture
- Experience with all the technologies

**The generator will ask you questions and give you good defaults for everything!**

## Step 1: Run the Generator

Open your terminal and type:

```bash
copier copy gh:GodSpeedAI/VibesPro my-new-project
```

Replace `my-new-project` with whatever folder name you want.

## Step 2: Answer the Questions

The generator will ask you a series of questions. Here's what to expect:

### Basic Information (Easy!)

**"What should we call your project?"**

```
Example: Task Manager Pro
Just type what you want people to call your app!
```

**"What's the technical name for your project?"**

```
We'll suggest one like: task-manager-pro
Press Enter to accept it, or type your own (lowercase with dashes).
```

**"Who's creating this project?"**

```
Example: Jane Smith
Your name or company name.
```

**"What email should we use?"**

```
Example: jane@example.com
This goes in documentation, not for signup.
```

### What Your Project Does

**"What does this project do?"**

```
Example: A task manager that helps small teams organize their work

Explain it like you're telling a friend! 1-2 sentences is perfect.
```

### Technology Choices (Pick What You Know)

**"How should we organize your code?"**

```
Choices:
→ Hexagonal (Recommended - clean and flexible) ← Choose this if unsure!
  Layered (Traditional approach)
  Microservices (Advanced)
```

**"What kind of user interface do you need?"**

```
Choices:
→ Next.js (Websites & web apps - recommended) ← For most people
  Remix (Fast modern websites)
  Expo (Mobile apps for iOS & Android) ← For mobile apps
```

**"What technology should power your backend?"**

```
Choices:
→ FastAPI (Modern & fast - recommended) ← Choose this if unsure!
  Flask (Simple & lightweight)
  Django (Full-featured with admin)
```

**"Where should we store your data?"**

```
Choices:
→ PostgreSQL (Professional - recommended) ← For real projects
  MySQL (Popular & widely supported)
  SQLite (Simple - good for learning) ← For practice/learning
```

**"Include Supabase integration?"**

```
→ Yes ← Gives you auth, real-time data, storage for free!
  No
```

### AI Features (Recommended!)

**"Include AI-assisted development tools?"**

```
→ Yes ← Makes coding easier with smart suggestions!
  No
```

**"Enable AI learning system?"**

```
→ Yes ← AI gets smarter as you work!
  No
```

### Advanced Options (You Can Skip These!)

For the remaining questions:

- If it says "(Advanced)" → **just press Enter to accept the default**
- If you're unsure → **press Enter to accept the default**

**All the defaults are carefully chosen to work great!**

## Step 3: Let It Build!

After you answer the questions:

1. The generator creates your project (takes ~30 seconds)
2. It installs dependencies (might take a few minutes)
3. You'll see a success message!

## Step 4: Open Your New Project

```bash
cd my-new-project
code .
```

(Or open the folder in your favorite editor)

## Step 5: Start Developing!

Your project includes:

### AI-Powered Features

- Open the GitHub Copilot chat
- Select a chat mode (like "Navigator" for general coding help)
- Start asking questions or requesting features!

### Ready-to-Run Commands

```bash
# Start the development server
just dev

# Run tests
just test

# Build for production
just build
```

### Organized Structure

```
your-project/
├── apps/           ← Your user interface code
├── libs/           ← Business logic organized by domain
├── docs/           ← Documentation (already written!)
├── .github/        ← AI chat modes and prompts
└── justfile        ← Easy commands for common tasks
```

## Common Questions

### "What if I pick the wrong option?"

Don't worry! Most choices can be changed later. The important thing is to get started.

### "What if I don't understand a question?"

Look for these clues in the question:

- **(Recommended)** → That's the safe choice
- **"If unsure, choose..."** → Follow that advice
- **"Advanced"** → Just press Enter to skip
- **Examples provided** → Pick something similar to the examples

### "Can I change my answers later?"

Yes! The file `copier.yml` in your project remembers your choices. You can update many things later.

### "What if something goes wrong?"

1. Read the error message carefully
2. Check if you entered a valid email address (must have @)
3. Check if project names don't have spaces or special characters
4. Try again with different answers

## Real Example: Building a Task Manager

Let's walk through creating a task management app:

**Session:**

```
What should we call your project?
→ Team Task Manager

What's the technical name?
→ [Press Enter] (accepts: team-task-manager)

Who's creating this project?
→ Sarah Johnson

What email should we use?
→ sarah@example.com

What does this project do?
→ A web app that helps small teams track and organize their tasks

How should we organize your code?
→ [Press Enter] (accepts: hexagonal)

What kind of user interface?
→ [Press Enter] (accepts: Next.js)

What technology for backend?
→ [Press Enter] (accepts: FastAPI)

Where to store data?
→ [Press Enter] (accepts: PostgreSQL)

Include Supabase?
→ [Press Enter] (accepts: yes)

Include AI tools?
→ [Press Enter] (accepts: yes)

[Everything else: Press Enter to accept defaults]
```

**Result:** Professional task manager scaffold ready in 2 minutes!

## What You Get

### Immediately Ready

- ✅ TypeScript frontend with Next.js
- ✅ Python backend with FastAPI
- ✅ Database connection configured
- ✅ User authentication (via Supabase)
- ✅ AI coding assistant configured
- ✅ Tests set up
- ✅ Documentation generated
- ✅ Development environment ready

### Included Free Services

- **Supabase** (if you chose it):
    - User login/signup
    - Database hosting
    - Real-time updates
    - File storage
    - Free tier available!

- **GitHub Copilot** (if you chose AI):
    - Smart code suggestions
    - Chat with AI about your code
    - Automatic best practices
    - Documentation generation

### What to Build Next

1. **Customize the example pages**
    - Look in `apps/your-app-name/`
    - Modify the sample components
    - Add your own pages

2. **Add your business logic**
    - Create entities in `libs/your-domain/domain/`
    - Add use cases in `libs/your-domain/application/`
    - Implement adapters in `libs/your-domain/infrastructure/`

3. **Use the AI assistant**
    - Ask it to generate components
    - Request new features
    - Get code reviews
    - Learn best practices

## Tips for Success

### 🎯 Start Simple

Don't try to build everything at once. Start with one feature and expand.

### 💬 Use the AI Chat

The AI modes are incredibly helpful! Don't be shy:

- "How do I add a new page?"
- "Create a user profile component"
- "What's the best way to handle form validation?"

### 📚 Read the Generated Docs

Your project includes documentation explaining how everything works. Check `docs/` folder!

### 🧪 Test as You Go

Run `just test` frequently to catch issues early.

### 🔄 Iterate Quickly

Make small changes, test them, repeat. The AI helps with this!

## Getting Help

### In Your Project

```bash
# Show available commands
just --list

# Show help for a specific command
just help

# Generate documentation
just docs
```

### AI Chat Modes

Open VS Code's chat and select:

- **Navigator** - General coding questions
- **TDD** - Test-driven development
- **Debug** - When something's broken
- **Spec** - Writing specifications

### Community

- GitHub Issues: Report bugs or ask questions
- Documentation: Check the generated `docs/` folder
- Examples: Look at the example code included

## Next Steps

1. ✅ **Explore** - Look around your generated project
2. ✅ **Experiment** - Try changing something small
3. ✅ **Ask the AI** - Use the chat modes to learn
4. ✅ **Build** - Start adding your features!
5. ✅ **Share** - Show us what you create!

## Appendix: Cheat Sheet

### Most Common Choices

**For a web application:**

```
Frontend: Next.js
Backend: FastAPI
Database: PostgreSQL
Supabase: Yes
AI: Yes
```

**For a mobile app:**

```
Frontend: Expo
Backend: FastAPI
Database: PostgreSQL
Supabase: Yes
AI: Yes
```

**For learning/practicing:**

```
Frontend: Next.js
Backend: Flask
Database: SQLite
Supabase: No
AI: Yes
```

### Safe Defaults

When in doubt, these work great:

- Architecture: Hexagonal
- Frontend: Next.js
- Backend: FastAPI
- Database: PostgreSQL
- Supabase: Yes
- AI Tools: Yes
- Everything else: [Press Enter]

---

**You're ready to build something amazing!** 🚀

Remember: The tool is here to help you succeed. Don't overthink the questions - the defaults are carefully chosen, and you can always adjust later. Happy building!
