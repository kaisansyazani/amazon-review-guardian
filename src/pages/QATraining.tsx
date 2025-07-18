
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle, XCircle, RotateCcw, Trophy, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty_level: string;
  category: string;
}

interface QuizSession {
  id: string;
  questions_answered: Array<{
    question_id: string;
    user_answer: number;
    is_correct: boolean;
  }>;
  score: number;
  total_questions: number;
  completed_at: string | null;
}

const QATraining = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const startNewQuiz = async () => {
    setLoading(true);
    try {
      // Fetch random 10 questions
      const { data: allQuestions, error: questionsError } = await supabase
        .from('qa_questions')
        .select('*');

      if (questionsError) throw questionsError;

      if (!allQuestions || allQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "Please check back later for quiz questions.",
          variant: "destructive"
        });
        return;
      }

      // Convert database questions to component format
      const formattedQuestions: Question[] = allQuestions.map((q: Tables<'qa_questions'>) => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options as string[] : JSON.parse(q.options as string),
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        category: q.category
      }));

      // Randomize and pick 10 questions (or all if less than 10)
      const shuffled = formattedQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(10, formattedQuestions.length));
      
      setQuestions(selectedQuestions);

      // Create new quiz session
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: null, // Allow anonymous users
          questions_answered: [],
          score: 0,
          total_questions: selectedQuestions.length
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Convert session to component format
      const formattedSession: QuizSession = {
        id: session.id,
        questions_answered: Array.isArray(session.questions_answered) 
          ? session.questions_answered as QuizSession['questions_answered']
          : [],
        score: session.score,
        total_questions: session.total_questions,
        completed_at: session.completed_at
      };

      setQuizSession(formattedSession);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setIsQuizComplete(false);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !quizSession || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    const updatedAnswers = [
      ...quizSession.questions_answered,
      {
        question_id: currentQuestion.id,
        user_answer: selectedAnswer,
        is_correct: isCorrect
      }
    ];

    const newScore = isCorrect ? quizSession.score + 1 : quizSession.score;

    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          questions_answered: updatedAnswers,
          score: newScore,
          completed_at: currentQuestionIndex === questions.length - 1 ? new Date().toISOString() : null
        })
        .eq('id', quizSession.id);

      if (error) throw error;

      setQuizSession({
        ...quizSession,
        questions_answered: updatedAnswers,
        score: newScore,
        completed_at: currentQuestionIndex === questions.length - 1 ? new Date().toISOString() : null
      });

      setShowExplanation(true);

      if (currentQuestionIndex === questions.length - 1) {
        setIsQuizComplete(true);
      }
    } catch (error) {
      console.error('Error updating quiz session:', error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setQuizSession(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsQuizComplete(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = quizSession ? (quizSession.questions_answered.length / quizSession.total_questions) * 100 : 0;

  if (!quizSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20 scale-150"></div>
                <div className="relative p-6 bg-gradient-primary rounded-3xl shadow-2xl w-fit mx-auto">
                  <Brain className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Q&A
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Master the art of detecting fake reviews with our interactive quiz system
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-xl">Smart Learning</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Randomized questions covering detection patterns, user behavior analysis, and review authenticity indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">10</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">Multi</div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-xl">Instant Feedback</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Get detailed explanations for each answer and track your progress with comprehensive scoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">Real-time</div>
                      <div className="text-sm text-muted-foreground">Results</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">Free</div>
                      <div className="text-sm text-muted-foreground">Access</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* CTA Section */}
            <div className="text-center">
              <Button 
                onClick={startNewQuiz} 
                disabled={loading}
                className="bg-gradient-primary hover:opacity-90 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Loading Questions...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Start Quiz
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isQuizComplete) {
    const scorePercentage = Math.round((quizSession.score / quizSession.total_questions) * 100);
    const getScoreColor = () => {
      if (scorePercentage >= 80) return "text-green-600";
      if (scorePercentage >= 60) return "text-yellow-600";
      return "text-red-600";
    };

    const getPerformanceMessage = () => {
      if (scorePercentage >= 80) return "Excellent! You have a strong understanding of fake review detection.";
      if (scorePercentage >= 60) return "Good job! You have a decent grasp of the concepts.";
      return "Keep learning! Review the explanations and try again.";
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <Card className="text-center border-0 shadow-2xl bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl scale-150"></div>
                  <Trophy className="h-16 w-16 text-yellow-500 mx-auto relative" />
                </div>
                <CardTitle className="text-3xl font-bold">Quiz Complete!</CardTitle>
                <CardDescription className="text-lg">Here are your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className={`text-6xl font-bold ${getScoreColor()}`}>
                    {quizSession.score}/{quizSession.total_questions}
                  </div>
                  <div className="text-xl text-muted-foreground">
                    {scorePercentage}% Correct
                  </div>
                  <div className="max-w-xs mx-auto">
                    <Progress value={scorePercentage} className="h-4 rounded-full" />
                  </div>
                </div>
                
                <div className="p-6 bg-muted/30 rounded-2xl">
                  <p className="text-lg font-medium">{getPerformanceMessage()}</p>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={resetQuiz} 
                    variant="outline" 
                    className="flex-1 py-6 text-base font-medium rounded-xl border-2 hover:bg-muted/50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/'} 
                    className="flex-1 py-6 text-base font-medium rounded-xl bg-gradient-primary hover:opacity-90"
                  >
                    Analyze Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Progress Section */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-card to-muted/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <span className="text-lg font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    Score: {quizSession.score}/{quizSession.questions_answered.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
              <Progress value={progress} className="h-3 rounded-full" />
            </CardContent>
          </Card>

          {/* Question Card */}
          {currentQuestion && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 text-sm font-medium border-primary/30 bg-primary/10 text-primary"
                  >
                    {currentQuestion.category}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="px-3 py-1 text-sm font-medium"
                  >
                    {currentQuestion.difficulty_level}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed font-semibold">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`text-left h-auto p-6 justify-start text-wrap transition-all duration-200 ${
                        showExplanation
                          ? index === currentQuestion.correct_answer
                            ? "bg-green-50 border-green-300 text-green-800 hover:bg-green-50 dark:bg-green-950/30 dark:border-green-600 dark:text-green-300"
                            : selectedAnswer === index && index !== currentQuestion.correct_answer
                            ? "bg-red-50 border-red-300 text-red-800 hover:bg-red-50 dark:bg-red-950/30 dark:border-red-600 dark:text-red-300"
                            : "opacity-60"
                          : selectedAnswer === index
                          ? "bg-primary text-primary-foreground border-primary shadow-lg transform scale-[1.02]"
                          : "hover:bg-muted/50 hover:border-primary/30 hover:transform hover:scale-[1.01]"
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {showExplanation && index === currentQuestion.correct_answer && (
                          <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        {showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                          <XCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span className="font-medium text-base leading-relaxed">{option}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                {showExplanation && (
                  <Card className="border-0 bg-gradient-to-r from-blue-50/80 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Explanation
                      </h4>
                      <p className="text-base leading-relaxed text-blue-800 dark:text-blue-200">
                        {currentQuestion.explanation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4 pt-4">
                  {!showExplanation ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="flex-1 py-6 text-base font-semibold rounded-xl bg-gradient-primary hover:opacity-90 disabled:opacity-50"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="flex-1 py-6 text-base font-semibold rounded-xl bg-gradient-primary hover:opacity-90"
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      {currentQuestionIndex === questions.length - 1 ? "View Results" : "Next Question"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QATraining;
