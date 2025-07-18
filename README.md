
# Amazon Review Authenticator

A comprehensive AI-powered tool for analyzing Amazon product reviews to detect fake, paid, bot-generated, and malicious reviews. This application provides detailed trust analysis, sentiment evaluation, and fraud detection to help users make informed purchasing decisions.

## 🚀 Features

### Core Analysis
- **Review Classification**: Automatically categorizes reviews as genuine, paid, bot-generated, or malicious
- **Trust Scoring**: Generates overall trust scores based on review authenticity
- **Sentiment Analysis**: Comprehensive sentiment and emotion analysis
- **Fraud Detection**: Advanced fraud risk assessment and price analysis
- **Verified Purchase Analysis**: Special weighting for Amazon verified purchases

### User Interface
- **Modern Design**: Clean, responsive interface with dark/light theme support
- **Interactive Dashboard**: Comprehensive results visualization with tabs and charts
- **Library System**: Save and manage analysis results for future reference
- **Q&A Training**: Interactive learning module to understand review authenticity

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **APIs**: RapidAPI, Apify for web scraping
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- RapidAPI account and API key
- Apify account and API token

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd amazon-review-authenticator
npm install
```

### 2. Environment Setup

The application uses Supabase secrets for API keys. You'll need to configure these in your Supabase dashboard:

**Required Secrets:**
- `RAPIDAPI_KEY`: Your RapidAPI key for Amazon data scraping
- `APIFY_TOKEN`: Your Apify token for web scraping services

### 3. Supabase Configuration

1. Create a new Supabase project
2. Update `src/integrations/supabase/client.ts` with your project credentials
3. Run the database migrations (see Database Setup section)
4. Configure the required secrets in Supabase Dashboard → Settings → Functions

### 4. Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄 Database Setup

The application uses three main tables:

### `analysis_results`
Stores complete analysis results for Amazon products
- Product information (ASIN, name)
- Review analysis data
- Trust scores and insights
- Sentiment analysis results
- AI-generated summaries

### `qa_questions`
Contains training questions for the Q&A learning module
- Multiple choice questions about review authenticity
- Difficulty levels and categories
- Explanations for correct answers

### `quiz_sessions`
Tracks user progress in Q&A training
- User quiz sessions and scores
- Questions answered and performance tracking

### Row Level Security (RLS)
- `analysis_results`: Publicly readable and deletable
- `qa_questions`: Publicly readable only
- `quiz_sessions`: User-specific access with authentication

## 🔑 API Configuration

### RapidAPI Setup
1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to Amazon data scraping APIs
3. Get your API key from the dashboard
4. Add the key as `RAPIDAPI_KEY` secret in Supabase

### Apify Setup
1. Create account at [Apify](https://apify.com/)
2. Get your API token from account settings
3. Add the token as `APIFY_TOKEN` secret in Supabase

## 📱 Usage

### Analyzing Products
1. Enter an Amazon product URL or ASIN on the homepage
2. Click "Authenticate Reviews" to start analysis
3. Wait for the AI to process and analyze reviews
4. View comprehensive results in the dashboard

### Review Analysis Dashboard
- **Overview**: Summary statistics and key insights
- **Fraud Analysis**: Risk assessment and price comparisons
- **Sentiment**: Emotion analysis and sentiment distribution
- **Reviews**: Individual review classifications and explanations

### Library Management
- All analysis results are automatically saved
- Access previous analyses from the Library page
- Delete unwanted results
- View detailed analysis for any saved product

### Q&A Training
- Learn to identify fake reviews through interactive questions
- Multiple difficulty levels and categories
- Track your progress with scoring system
- Detailed explanations for each answer

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AnalysisProgress.tsx
│   ├── DetailedAnalysisView.tsx
│   ├── ResultsDashboard.tsx
│   └── ...
├── pages/              # Route components
│   ├── Index.tsx       # Homepage
│   ├── Library.tsx     # Saved results
│   ├── QATraining.tsx  # Learning module
│   └── HowItWorks.tsx  # Information page
├── integrations/       # Supabase integration
│   └── supabase/
├── types/              # TypeScript definitions
└── lib/               # Utility functions
```

## 🔧 Development

### Building for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🚀 Deployment

The easiest way to deploy is through Lovable's built-in deployment:

1. Open your project in Lovable
2. Go to Share → Publish
3. Your app will be deployed with a custom URL

### Custom Domain
Connect a custom domain through Project → Settings → Domains in Lovable.

## 🔒 Security & Privacy

- All API keys are stored securely in Supabase secrets
- Row Level Security (RLS) policies protect user data
- No personal information is stored or transmitted
- Analysis results can be deleted by users at any time

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 API Endpoints

### Edge Functions
- `/analyze-reviews`: Main analysis endpoint that processes Amazon URLs
  - Handles web scraping via Apify
  - Performs AI analysis on review data
  - Stores results in database

## 🐛 Troubleshooting

### Common Issues

**Analysis not working:**
- Check that RAPIDAPI_KEY and APIFY_TOKEN are configured
- Verify the Amazon URL format is correct
- Check Supabase function logs for errors

**Database errors:**
- Ensure all migrations have been run
- Check RLS policies are properly configured
- Verify Supabase connection settings

**Build errors:**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run type-check`
- Verify all imports and file paths are correct

### Debug Mode
Add console.log statements to track issues - they're automatically available in the browser console and Supabase function logs.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Powered by [Supabase](https://supabase.com/) backend services
