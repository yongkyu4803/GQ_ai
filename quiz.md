import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Trophy, BookOpen } from 'lucide-react';

const AIQuizApp = () => {
  const [currentLevel, setCurrentLevel] = useState('선택');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const quizData = {
    초급: {
      title: "초급 단계 - 기본 개념 이해",
      subtitle: "생성형 AI의 기본 개념과 도구 이해도를 평가합니다",
      questions: [
        {
          id: 1,
          question: "생성형 AI(Generative AI)에 대한 설명으로 가장 적절한 것은?",
          options: [
            "기존 데이터를 분석하여 패턴을 찾는 AI",
            "새로운 콘텐츠(텍스트, 이미지, 코드 등)를 생성하는 AI",
            "특정 작업을 자동화하는 AI",
            "음성을 인식하는 AI"
          ],
          correct: 1
        },
        {
          id: 2,
          question: "멀티모달 AI(Multimodal AI)에 대한 설명으로 가장 적절한 것은?",
          options: [
            "여러 언어를 동시에 사용할 수 있는 AI",
            "텍스트, 이미지, 음성 등 다양한 형태의 데이터를 처리할 수 있는 AI",
            "여러 사용자가 동시에 사용할 수 있는 AI",
            "여러 개의 모델을 조합한 AI"
          ],
          correct: 1
        },
        {
          id: 3,
          question: "프롬프트(Prompt)란 무엇인가요?",
          options: [
            "AI가 생성한 결과물",
            "AI에게 주는 명령이나 질문",
            "AI의 학습 데이터",
            "AI의 응답 속도"
          ],
          correct: 1
        },
        {
          id: 4,
          question: "추론 모델(Reasoning Model)과 비추론 모델의 차이점으로 가장 적절한 것은?",
          options: [
            "추론 모델은 답변 속도가 더 빠르다",
            "추론 모델은 복잡한 문제를 단계적으로 분석하여 해결한다",
            "추론 모델은 더 많은 데이터로 학습되었다",
            "추론 모델은 이미지 생성에 특화되어 있다"
          ],
          correct: 1
        },
        {
          id: 5,
          question: "생성형 AI가 가장 어려워하는 작업은?",
          options: [
            "텍스트 요약",
            "실시간 정보 검색",
            "언어 번역",
            "코드 작성"
          ],
          correct: 1
        },
        {
          id: 6,
          question: "효과적인 프롬프트 작성법으로 옳지 않은 것은?",
          options: [
            "구체적이고 명확하게 작성한다",
            "원하는 결과의 형식을 지정한다",
            "가능한 한 짧게 작성한다",
            "예시를 함께 제공한다"
          ],
          correct: 2
        },
        {
          id: 7,
          question: "생성형 AI의 '환각(Hallucination)' 현상이란?",
          options: [
            "AI가 너무 빠르게 응답하는 것",
            "AI가 사실이 아닌 정보를 그럴듯하게 생성하는 것",
            "AI가 응답을 거부하는 것",
            "AI가 같은 답변을 반복하는 것"
          ],
          correct: 1
        },
        {
          id: 8,
          question: "RAG(Retrieval-Augmented Generation) 기술에 대한 설명으로 가장 적절한 것은?",
          options: [
            "AI가 특정 문서나 데이터베이스를 참조하여 더 정확한 정보를 제공하는 기술",
            "AI의 응답 속도를 높이는 기술",
            "AI가 이미지를 생성하는 기술",
            "AI의 창의성을 향상시키는 기술"
          ],
          correct: 0
        },
        {
          id: 9,
          question: "AI 에이전트(AI Agent)의 특징으로 가장 적절한 것은?",
          options: [
            "단순 질답을 넘어 복잡한 작업을 자동으로 수행할 수 있음",
            "사람보다 빠른 타이핑 속도를 가짐",
            "24시간 온라인 상태를 유지함",
            "여러 언어를 동시에 처리함"
          ],
          correct: 0
        },
        {
          id: 10,
          question: "바이브 코딩(Vibe Coding)에 대한 설명으로 가장 적절한 것은?",
          options: [
            "정확한 문법보다는 자연어로 대략적인 의도를 전달하여 AI가 코드를 생성하도록 하는 방식",
            "음악을 들으며 코딩하는 방법",
            "여러 명이 함께 코딩하는 방법",
            "빠른 속도로 코딩하는 기법"
          ],
          correct: 0
        }
      ]
    },
    중급: {
      title: "중급 단계 - 실무 활용",
      subtitle: "실무에서의 AI 활용 능력과 고급 기법을 평가합니다",
      questions: [
        {
          id: 1,
          question: "프롬프트 엔지니어링에서 '퓨샷 러닝(Few-shot Learning)'이란?",
          options: [
            "AI에게 한 번만 예시를 보여주는 것",
            "AI에게 여러 개의 예시를 제공하여 패턴을 학습시키는 것",
            "AI의 학습 데이터를 줄이는 것",
            "AI의 응답 속도를 높이는 것"
          ],
          correct: 1
        },
        {
          id: 2,
          question: "\"당신은 전문 마케터입니다. 20대 여성을 타겟으로 한 화장품 광고 카피를 3개 작성해 주세요.\" 이 프롬프트에서 사용된 기법은?",
          options: [
            "역할 부여(Role Playing)",
            "단계별 사고(Step-by-step)",
            "체인 오브 쏘트(Chain of Thought)",
            "제로샷 러닝(Zero-shot Learning)"
          ],
          correct: 0
        },
        {
          id: 3,
          question: "RAG(Retrieval-Augmented Generation) 기술의 주요 목적은?",
          options: [
            "AI의 응답 속도를 높이기 위해",
            "AI가 최신 정보나 특정 문서를 참조하여 답변하게 하기 위해",
            "AI의 창의성을 높이기 위해",
            "AI의 에너지 소비를 줄이기 위해"
          ],
          correct: 1
        },
        {
          id: 4,
          question: "업무에서 AI를 활용할 때 가장 우선적으로 고려해야 할 것은?",
          options: [
            "최신 AI 도구 사용",
            "데이터 보안 및 개인정보 보호",
            "비용 절감",
            "처리 속도"
          ],
          correct: 1
        },
        {
          id: 5,
          question: "다음 중 AI 생성 콘텐츠를 검토할 때 확인해야 할 항목이 아닌 것은?",
          options: [
            "사실 정확성",
            "편향성 여부",
            "생성 시간",
            "맥락 적절성"
          ],
          correct: 2
        },
        {
          id: 6,
          question: "프롬프트에서 \"단계별로 생각해보세요\"라는 지시의 효과는?",
          options: [
            "AI의 처리 속도를 높인다",
            "AI가 더 논리적이고 체계적으로 사고하도록 유도한다",
            "AI의 창의성을 제한한다",
            "AI의 토큰 사용량을 줄인다"
          ],
          correct: 1
        },
        {
          id: 7,
          question: "업무 효율성을 높이기 위한 프롬프트 최적화 방법으로 가장 적절한 것은?",
          options: [
            "반복 사용할 프롬프트는 템플릿화하고 변수 부분만 교체하여 활용",
            "매번 새로운 방식으로 질문하기",
            "가능한 복잡하고 긴 프롬프트 작성",
            "AI가 알아서 하도록 간단하게만 요청"
          ],
          correct: 0
        },
        {
          id: 8,
          question: "기업에서 AI 도입 시 우선순위 결정 기준으로 가장 적절한 것은?",
          options: [
            "ROI가 명확하고 위험도가 낮은 업무부터 단계적 도입",
            "가장 복잡한 업무부터 자동화",
            "모든 부서에 동시 도입",
            "경쟁사 따라하기"
          ],
          correct: 0
        },
        {
          id: 9,
          question: "AI 생성 콘텐츠의 품질을 체계적으로 관리하는 방법은?",
          options: [
            "평가 기준을 사전에 정의하고 일관된 검토 프로세스 적용",
            "AI를 믿고 그대로 사용",
            "문법만 확인하면 충분",
            "다른 AI로 재검증만 하기"
          ],
          correct: 0
        },
        {
          id: 10,
          question: "업무 프로세스에 AI를 통합할 때 가장 중요한 고려사항은?",
          options: [
            "기존 워크플로우 분석 후 AI 적용 지점을 명확히 정의",
            "AI가 모든 업무를 대체하도록 설계",
            "사람의 개입 없이 완전 자동화",
            "가장 복잡한 업무부터 AI 적용"
          ],
          correct: 0
        }
      ]
    }
  };

  const getScoreLevel = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { level: "우수", color: "text-green-600", message: "매우 훌륭합니다!" };
    if (percentage >= 70) return { level: "양호", color: "text-blue-600", message: "잘 하고 있습니다!" };
    if (percentage >= 50) return { level: "보통", color: "text-yellow-600", message: "더 학습이 필요합니다." };
    return { level: "부족", color: "text-red-600", message: "추가 학습을 권장합니다." };
  };

  const handleLevelSelect = (level) => {
    setCurrentLevel(level);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResult(false);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData[currentLevel].questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    const questions = quizData[currentLevel].questions;
    let correctCount = 0;
    
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct) {
        correctCount++;
      }
    });
    
    setShowResult({ score: correctCount, total: questions.length });
  };

  const resetQuiz = () => {
    setCurrentLevel('선택');
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResult(false);
    setQuizCompleted(false);
  };

  if (currentLevel === '선택') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              생성형 AI 이해도 평가 퀴즈
            </h1>
            <p className="text-xl text-gray-600">
              당신의 AI 지식 수준을 확인해보세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => handleLevelSelect('초급')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300"
            >
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-3">초급 단계</h2>
                <p className="text-gray-600 mb-4">기본 개념과 도구 이해도</p>
                <ul className="text-sm text-gray-500 text-left space-y-1">
                  <li>• 생성형 AI 기본 개념</li>
                  <li>• 주요 AI 도구 구분</li>
                  <li>• 기본 프롬프트 작성</li>
                  <li>• AI 한계점 인식</li>
                </ul>
                <div className="mt-6">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    10문항
                  </span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleLevelSelect('중급')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-300"
            >
              <div className="text-center">
                <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-3">중급 단계</h2>
                <p className="text-gray-600 mb-4">실무 활용과 고급 기법</p>
                <ul className="text-sm text-gray-500 text-left space-y-1">
                  <li>• 프롬프트 엔지니어링</li>
                  <li>• 업무 적용 전략</li>
                  <li>• AI 윤리와 보안</li>
                  <li>• 성능 평가와 최적화</li>
                </ul>
                <div className="mt-6">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    10문항
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const scoreInfo = getScoreLevel(showResult.score, showResult.total);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">퀴즈 완료!</h2>
            <div className="text-6xl font-bold mb-4">
              <span className={scoreInfo.color}>
                {showResult.score}/{showResult.total}
              </span>
            </div>
            <div className="mb-6">
              <div className={`text-2xl font-semibold mb-2 ${scoreInfo.color}`}>
                {scoreInfo.level}
              </div>
              <p className="text-gray-600">{scoreInfo.message}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">상세 결과</h3>
              <div className="space-y-2 text-sm">
                {quizData[currentLevel].questions.map((question, index) => {
                  const isCorrect = selectedAnswers[question.id] === question.correct;
                  return (
                    <div key={question.id} className="flex items-center justify-between">
                      <span>문항 {index + 1}</span>
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleLevelSelect(currentLevel === '초급' ? '중급' : '초급')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {currentLevel === '초급' ? '중급 단계 도전하기' : '초급 단계 다시하기'}
              </button>
              <button
                onClick={resetQuiz}
                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                처음으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = quizData[currentLevel].questions[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestionData.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {quizData[currentLevel].title}
              </h1>
              <button
                onClick={resetQuiz}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600">{quizData[currentLevel].subtitle}</p>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>진행률</span>
                <span>{currentQuestion + 1} / {quizData[currentLevel].questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quizData[currentLevel].questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {currentQuestion + 1}. {currentQuestionData.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestionData.id, index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedAnswers[currentQuestionData.id] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-700 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentQuestion === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              이전
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`px-6 py-2 rounded-lg font-medium ${
                !isAnswered
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentQuestion === quizData[currentLevel].questions.length - 1 ? '결과 보기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuizApp;