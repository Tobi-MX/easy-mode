# Easy Mode: High-Signal Shipping

Easy Mode is a CLI tool designed for developers who "Build in Public." It analyzes your recent Git commits and generates punchy, high-signal social media posts for **𝕏 (Twitter)**, **LinkedIn**, and **Discord**.

Stop wasting time thinking about what to tweet. Focus on the code; let Easy Mode handle the noise.

## 🛠️ Features

- **Git Integration:** Automatically extracts context from your branches and diffs.
- **AI-Powered:** Uses Google Gemini (and now OpenAI GPT-4o) to generate technical updates.
- **Interactive CLI:** A polished terminal experience powered by `@clack/prompts`.
- **VS Code Sync:** Tweak your drafts directly in your favorite editor.
- **Custom Style:** Define your tone, banned words, and favorite vocabulary.

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Google Gemini API Key or OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/Tobi-MX/easy-mode.git
cd easy-mode

# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Add your API keys to .env
```

### Usage

Run the tool:

```bash
npx tsx src/index.ts
```

Follow the setup wizard if it's your first time, then select the number of commits and the target platform.

## 🧠 The "High-Signal" Philosophy

Easy Mode isn't about generic AI fluff. It's built on three pillars:
1. **Logic:** What actually changed in the code?
2. **Architecture:** How does it affect the system's "skeleton"?
3. **Value:** Why does this matter to users or the business?

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License.
