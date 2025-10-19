import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Exam() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const { API, getAuthHeaders } = useAuth();
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchTest();
    enterFullscreen();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      exitFullscreen();
    };
  }, [testId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            handleSubmit(true);
            toast.error('Test auto-submitted due to tab switching!');
          } else {
            setShowWarning(true);
            toast.warning(`Warning ${newCount}/2: Do not switch tabs!`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchTest = async () => {
    try {
      const response = await axios.get(`${API}/tests/${testId}`, {
        headers: getAuthHeaders()
      });
      setTest(response.data);
      setTimeLeft(response.data.duration * 60);
      startTimer(response.data.duration * 60);
    } catch (error) {
      toast.error('Failed to load test');
      navigate('/gate');
    }
  };

  const startTimer = (duration) => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const formattedAnswers = test.questions.map(q => ({
      qId: q.id,
      chosen: answers[q.id] !== undefined ? answers[q.id] : null
    }));

    try {
      const response = await axios.post(
        `${API}/tests/submit/${testId}`,
        { answers: formattedAnswers, timeSpent },
        { headers: getAuthHeaders() }
      );
      
      exitFullscreen();
      navigate(`/results/${response.data.attemptId}`);
    } catch (error) {
      toast.error('Failed to submit test');
    }
  };

  if (!test) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const currentQ = test.questions[currentQuestion];

  return (
    <div className="exam-fullscreen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center border-b">
        <div>
          <h1 className="text-xl font-bold" data-testid="exam-title">{test.title}</h1>
          <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {test.questions.length}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-lg font-semibold" data-testid="timer">
            <Clock className="w-5 h-5" />
            <span className={timeLeft < 300 ? 'text-red-600' : 'text-teal-600'}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <Button onClick={() => handleSubmit(false)} variant="destructive" data-testid="submit-btn">
            Submit Test
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <span className="text-sm font-semibold text-gray-600">Question {currentQuestion + 1}</span>
            {currentQ?.questionType === 'MSQ' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Multiple Select</span>
            )}
          </div>
          
          <p className="text-lg mb-6" data-testid="question-text">{currentQ?.text}</p>

          {currentQ?.questionType === 'MSQ' ? (
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${idx}`}
                    checked={Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(idx)}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                      const updated = checked 
                        ? [...current, idx]
                        : current.filter(i => i !== idx);
                      handleAnswerChange(currentQ.id, updated);
                    }}
                    data-testid={`option-${idx}`}
                  />
                  <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">{option}</Label>
                </div>
              ))}
            </div>
          ) : (
            <RadioGroup value={answers[currentQ?.id]?.toString()} onValueChange={(val) => handleAnswerChange(currentQ.id, parseInt(val))}>
              {currentQ?.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} data-testid={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            variant="outline"
            data-testid="prev-btn"
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentQuestion(prev => Math.min(test.questions.length - 1, prev + 1))}
            disabled={currentQuestion === test.questions.length - 1}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="next-btn"
          >
            Next
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {test.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-10 h-10 rounded-lg border-2 font-semibold ${
                idx === currentQuestion
                  ? 'bg-teal-600 text-white border-teal-600'
                  : answers[test.questions[idx].id] !== undefined
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
              data-testid={`question-nav-${idx}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Warning!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You switched tabs! This is your {tabSwitchCount} warning. 
              One more violation will result in automatic test submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button onClick={() => setShowWarning(false)} className="bg-teal-600 hover:bg-teal-700">Understood</Button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
