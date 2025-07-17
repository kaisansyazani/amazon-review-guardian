
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <Brain className="h-16 w-16 text-primary mx-auto" />
              <h1 className="text-4xl font-bold">Q&A Training</h1>
              <p className="text-xl text-muted-foreground">
                Test your knowledge on detecting fake reviews
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle>Learn to Spot Fake Reviews</CardTitle>
                <CardDescription>
                  Take our interactive quiz to sharpen your skills in identifying fraudulent product reviews. 
                  Each session contains 10 randomized questions covering various aspects of review fraud detection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">10</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Multiple</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Instant</div>
                    <div className="text-sm text-muted-foreground">Feedback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">Free</div>
                    <div className="text-sm text-muted-foreground">Access</div>
                  </div>
                </div>
                
                <Button 
                  onClick={startNewQuiz} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Loading..." : "Start Quiz"}
                </Button>
              </CardContent>
            </Card>
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-2xl mx-auto space-y-8">
            <Card className="text-center">
              <CardHeader>
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                <CardDescription>Here are your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className={`text-4xl font-bold ${getScoreColor()}`}>
                    {quizSession.score}/{quizSession.total_questions}
                  </div>
                  <div className="text-muted-foreground">
                    {scorePercentage}% Correct
                  </div>
                  <Progress value={scorePercentage} className="h-3" />
                </div>
                
                <p className="text-lg">{getPerformanceMessage()}</p>
                
                <div className="flex gap-4">
                  <Button onClick={resetQuiz} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={() => window.location.href = '/'} className="flex-1">
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  Score: {quizSession.score}/{quizSession.questions_answered.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Question Card */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{currentQuestion.category}</Badge>
                  <Badge variant="secondary">{currentQuestion.difficulty_level}</Badge>
                </div>
                <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedAnswer === index ? "default" : "outline"
                      }
                      className={`text-left h-auto p-4 justify-start ${
                        showExplanation
                          ? index === currentQuestion.correct_answer
                            ? "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300"
                            : selectedAnswer === index && index !== currentQuestion.correct_answer
                            ? "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300"
                            : ""
                          : ""
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                    >
                      <div className="flex items-center gap-2">
                        {showExplanation && index === currentQuestion.correct_answer && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>{option}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                {showExplanation && (
                  <Card className="bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p className="text-sm">{currentQuestion.explanation}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4">
                  {!showExplanation ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="flex-1"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="flex-1"
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
