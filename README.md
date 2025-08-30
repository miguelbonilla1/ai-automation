# 🤖 AI-Enhanced To-Do List App

A Next.js to-do list application with AI-powered task enhancement, built with Supabase, N8N automation, and deployed on Vercel. Updated for production deployment - v2.

## ✨ Features

- ✅ **Add, Edit, Complete, Delete** tasks
- 🤖 **AI-powered task enhancement** via OpenAI
- 🔄 **Real-time updates** with Supabase
- 🚀 **Deployed on Vercel**
- 🔧 **N8N automation workflow**

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Automation**: N8N
- **AI**: OpenAI GPT
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- N8N account
- OpenAI API key
- Vercel account

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd todo-ai
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# N8N
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_BEARER_TOKEN=your_n8n_bearer_token

# API Security
TASK_ENHANCE_SECRET=your_secret_key
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run this SQL in the SQL Editor:

```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  enhanced_title TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow read/write for anon" ON tasks
  FOR ALL USING (true);
```

### 4. N8N Workflow Setup

1. Create a new workflow in N8N
2. Add nodes in this order:

   - **Webhook** (trigger)
   - **OpenAI** (Message a Model)
   - **HTTP Request** (to your API)

3. Configure OpenAI node:

   - Model: GPT-3.5-turbo
   - System Prompt: "You are a task enhancement assistant. Make task titles clearer, break them into steps, or enrich them with relevant info. Return only the enhanced title."
   - User Prompt: `{{$json.title}}`

4. Configure HTTP Request node:
   - Method: POST
   - URL: `https://your-vercel-app.vercel.app/api/enhance`
   - Headers: `x-enhance-secret: your_secret_key`
   - Body:
   ```json
   {
     "taskId": "{{$('Webhook').item.json.body.taskId}}",
     "enhancedTitle": "{{$json.message.content}}"
   }
   ```

### 5. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🔧 API Endpoints

### POST `/api/enhance`

Updates task with AI-enhanced title.

**Headers:**

- `x-enhance-secret`: Your secret key

**Body:**

```json
{
  "taskId": "uuid",
  "enhancedTitle": "Enhanced task title"
}
```

## 📱 How It Works

1. **User creates task** → Stored in Supabase
2. **N8N webhook triggered** → Receives task data
3. **OpenAI enhances title** → Makes it clearer/better
4. **HTTP request sent** → Updates task in Supabase
5. **UI updates** → Shows enhanced title

## 🎯 Project Structure

```
todo-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main UI + Server Actions
│   │   └── api/
│   │       └── enhance/
│   │           └── route.ts  # N8N callback API
│   └── lib/
│       └── supabaseClient.ts # Supabase configuration
├── .env.local               # Environment variables
└── README.md               # This file
```

## 🔒 Security

- Row Level Security enabled in Supabase
- API authentication with secret token
- Environment variables for sensitive data

## 🚀 Live Demo

- **Web App**: [https://ai-automation-liard.vercel.app](https://ai-automation-liard.vercel.app)
- **GitHub**: [Your repo URL]
- **N8N Access**: [Your N8N workflow URL]

## 📝 TODO (Bonus Features)

- [ ] WhatsApp integration via Evolution API
- [ ] Filter messages with `#to-do` hashtag
- [ ] User authentication
- [ ] Task categories/tags
- [ ] Due dates and reminders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and development!
