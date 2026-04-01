# Figma Claude Automator PoC

A proof-of-concept (PoC) Figma plugin that integrates Anthropic's Claude API to dynamically generate and modify Figma canvas elements using natural language prompts. This project demonstrates how AI can logically structure and build UI components directly within the Figma sandbox.

## Architecture

- **Figma UI (`ui.html`):** The client-facing iframe. It captures user prompts, enforces a strict JSON output format via the System Prompt, and handles the HTTP `POST` request to the Anthropic API.
- **Figma Main Thread (`code.ts`):** The execution context. It receives the parsed JSON payload from the UI via `postMessage` and utilizes the Figma Plugin API to mutate the canvas (e.g., creating frames, rectangles, text nodes, and applying fills).

## Prerequisites

- **Node.js:** v18 or higher recommended.
- **Figma Desktop App:** Required for local plugin development (macOS environment).
- **Anthropic API Key:** A valid key with access to `claude-3-5-sonnet-20241022`.

## Installation & Setup

### 1. Clone and Install

Execute the following commands to set up the repository and dependencies:

```bash
git clone git@github.com:kurtco/figma-claude-poc.git
cd figma-claude-poc
npm install -D typescript @figma/plugin-typing
git pull
```

### 2. Obtaining an Anthropic API Key

Follow these steps to secure the necessary credentials:

- **Access the Console:** Go to [console.anthropic.com](https://console.anthropic.com) and sign up using a professional email or SSO (Google/Microsoft).
- **Billing Configuration:** Anthropic uses a prepaid credit system.
  - Navigate to **Settings > Billing**.
  - Register a credit card and make an initial purchase (minimum $5 USD).
  - **Note:** Set a "Monthly Spending Limit" to avoid unexpected charges during architectural testing.
- **Generate the Key:** \* Select **API Keys** from the side menu or profile menu.
  - Click **+ Create Key** and name it (e.g., `figma-claude-poc-dev`).
  - **Critical:** Copy the key immediately. Anthropic only displays it once.

### 3. Credential Verification

- Open `ui.html`.
- Locate the string `sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXX`.
- Replace it with your actual **Anthropic API key**.
- Save the file.

### 4. Build the Plugin

Compile the TypeScript source code into the JavaScript distribution file:

```bash
npx tsc
```

---

## Usage

### 1. Importing into Figma

- Open the **Figma Desktop App**.
- Click on `+ Design file` to open a new blank canvas.
- Open the main Figma menu (top-left logo).
- Navigate to **Plugins > Development > Import plugin from manifest...**.
- Select the `manifest.json` file located in the root of the repository.

### 2. Executing the PoC

- Go to **Plugins > Development > Claude Automator PoC**.
- The interface Iframe (`ui.html`) will render.
- Enter a test prompt, for example:
  > "Generate a 500x300 rectangle with a black background and centered text that says 'Proof of Concept Completed'."
- Click on **Generar en Canvas**.
