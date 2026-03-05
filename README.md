# Protocol — Private AI Transcription & Summarization

Protocol is a premium, privacy-focused web application designed to handle meetings and voice recordings entirely on the client-side. By leveraging state-of-the-art AI models directly in the browser, Protocol ensures that your sensitive audio data never leaves your device during transcription.

![App Interface Mockup](https://raw.githubusercontent.com/VivoUtMori/protocol/main/public/demo-screenshot.png) *(Placeholder for actual screenshot)*

## 🚀 Key Features

- **🔒 Secure Local Transcription**: Uses `@xenova/transformers` (Whisper) to perform speech-to-text inference directly in a Web Worker. Your audio stays private.
- **🧠 AI Summarization**: Integrated support for **Google Gemini** and OpenAI-compatible endpoints to generate structured summaries, action items, and key takeaways.
- **📝 Markdown Detail View**: Dedicated views for every recording with full Markdown support for AI-generated summaries.
- **🗃️ History Management**: A clean, searchable history of all your past transcriptions and summaries, stored securely in a local-first database.
- **⚙️ Configurable AI Providers**: Easily switch between local LLMs (via Custom URL) or Google Gemini in the Settings page.
- **✨ Premium UI**: Modern, glassmorphic design system with a focus on usability and aesthetics.

## 🛠️ Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, Vanilla CSS (Premium Design System)
- **Database**: Prisma with LibSQL (SQLite/Turso)
- **Authentication**: NextAuth.js
- **AI/ML**: Transformers.js (Whisper Tiny/Base), Google Gemini API
- **Testing**: Vitest, Playwright

## 🏁 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 20+** and **npm** installed on your system.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/VivoUtMori/protocol.git
cd protocol
npm install
```

### 3. Database Setup
Initialize the local database:
```bash
npx prisma migrate dev --name init
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Configure your LLM
1. Log in to the application.
2. Navigate to **Settings**.
3. Choose your provider (**Google Gemini** or **OpenAI-compatible**).
4. Enter your API Key and Model Name.
5. Use the **Test Connection** button to verify your configuration.

## 🧪 Testing
Run unit and integration tests:
```bash
npm test
```
Run end-to-end tests:
```bash
npm run test:e2e
```

## 📖 License
This project is licensed under the MIT License.

