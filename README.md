# cppninja - Coding Practice & Mock Interview Platform

A Next.js web application where users can practice programming problems and conduct mock interviews with real-time collaboration and video/audio.

## Features

- **Coding Problems**: Practice with curated problems across all difficulty levels
- **Code Execution**: Run your code instantly with Judge0 integration
- **Mock Interviews**: Schedule and conduct mock interviews with peers
- **Real-time Collaboration**: Collaborative code editor using Yjs
- **Video/Audio**: Built-in video chat using Daily.co

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google & GitHub OAuth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Code Editor**: Monaco Editor
- **Code Execution**: Judge0 API
- **Real-time Collaboration**: Yjs + y-websocket
- **Video/Audio**: Daily.co API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for:
  - Google OAuth
  - GitHub OAuth
  - Judge0 (RapidAPI)
  - Daily.co

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cppninja
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cppninja"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your-rapidapi-key"
DAILY_API_KEY="your-daily-api-key"
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
cppninja/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # User dashboard
│   │   ├── interviews/     # Interview pages
│   │   ├── problems/       # Problem pages
│   │   └── signin/         # Authentication
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Seed data
└── package.json
```

## API Routes

- `POST /api/submissions` - Submit code for evaluation
- `POST /api/submissions/run` - Run code without saving
- `GET /api/problems` - List all problems
- `GET /api/problems/[slug]` - Get problem details
- `GET/POST /api/interviews` - Interview CRUD
- `POST /api/interviews/[id]/start` - Start interview
- `POST /api/interviews/[id]/end` - End interview

## External Services Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`

### Judge0
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to Judge0 CE API
3. Copy your API key

### Daily.co
1. Sign up at [Daily.co](https://daily.co)
2. Get your API key from the dashboard

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database
Use [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech) for hosted PostgreSQL.

## License

MIT
