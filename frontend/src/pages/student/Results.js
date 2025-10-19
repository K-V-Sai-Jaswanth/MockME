import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Target, Clock, TrendingUp, CheckCircle, XCircle, Home } from 'lucide-react';

export default function Results() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [explanations, setExplanations] = useState({});
  const { API, getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API}/tests/results/${attemptId}`, {
        headers: getAuthHeaders()
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchExplanation = async (questionId, userAnswer) => {
    if (explanations[questionId]) return;
    
    try {
      const response = await axios.post(
        `${API}/ai/explain`,
        { questionId, userAnswer },
        { headers: getAuthHeaders() }
      );
      setExplanations(prev => ({ ...prev, [questionId]: response.data.explanation }));
    } catch (error) {
      console.error('Error fetching explanation:', error);
    }
  };

  if (!result) return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;

  const answerMap = {};
  result.answers.forEach(ans => {
    answerMap[ans.qId] = ans.chosen;
  });

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-teal-700">MockME</span>
          <div className="flex gap-4">
            <Link to="/profile"><Button variant="outline" data-testid="profile-btn">Profile</Button></Link>
            <Link to="/"><Button variant="ghost" data-testid="home-btn"><Home className="w-4 h-4 mr-2" />Home</Button></Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="results-title">Test Results</h1>
          <p className="text-gray-600">{result.test?.title}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg" data-testid="score-card">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8" />
              <p className="text-lg">Your Score</p>
            </div>
            <p className="text-4xl font-bold">{result.score.toFixed(1)}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="percentile-card">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-teal-600" />
              <p className="text-lg text-gray-700">Percentile</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{result.percentile}%</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="accuracy-card">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-teal-600" />
              <p className="text-lg text-gray-700">Accuracy</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{(result.accuracy * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="time-card">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-teal-600" />
              <p className="text-lg text-gray-700">Time Taken</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{Math.floor(result.timeData?.totalTime / 60)}m</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Detailed Solutions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {result.questions?.map((question, idx) => {
              const userAnswer = answerMap[question.id];
              const isCorrect = question.questionType === 'MSQ'
                ? JSON.stringify(userAnswer?.sort()) === JSON.stringify(question.correctAnswer?.sort())
                : userAnswer === question.correctAnswer;

              return (
                <AccordionItem key={question.id} value={question.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline" data-testid={`question-accordion-${idx}`}>
                    <div className="flex items-center gap-3 text-left">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold">Question {idx + 1}</span>
                      <Badge variant={isCorrect ? "default" : "destructive"} className="ml-2">
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      <p className="font-medium" data-testid={`question-text-${idx}`}>{question.text}</p>
                      
                      <div className="space-y-2">
                        {question.options?.map((option, optIdx) => {
                          const isUserAnswer = question.questionType === 'MSQ'
                            ? Array.isArray(userAnswer) && userAnswer.includes(optIdx)
                            : userAnswer === optIdx;
                          const isCorrectAnswer = question.questionType === 'MSQ'
                            ? question.correctAnswer?.includes(optIdx)
                            : question.correctAnswer === optIdx;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectAnswer
                                  ? 'bg-green-50 border-green-500'
                                  : isUserAnswer
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                              data-testid={`option-${idx}-${optIdx}`}
                            >
                              <span>{option}</span>
                              {isCorrectAnswer && <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>}
                              {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-blue-900 mb-2">AI Explanation:</p>
                        {explanations[question.id] ? (
                          <p className="text-blue-800" data-testid={`explanation-${idx}`}>{explanations[question.id]}</p>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => fetchExplanation(question.id, userAnswer)}
                            className="bg-blue-600 hover:bg-blue-700"
                            data-testid={`get-explanation-btn-${idx}`}
                          >
                            Get AI Explanation
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/gate">
            <Button className="bg-teal-600 hover:bg-teal-700" data-testid="more-tests-btn">
              Take More Tests
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" data-testid="view-profile-btn">View Profile</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
