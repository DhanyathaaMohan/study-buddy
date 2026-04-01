"use client";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type Video = {
  title: string;
  url: string;
};

type RecommendationResponse = {
  topic: string;
  videos: Video[];
  type?: string;
  reason?: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type QuizEvaluationResponse = {
  score: number;
  feedback: string;
  next_difficulty: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type TopicProgress = {
  topic: string;
  scores: number[];
  current_difficulty: string;
  last_score: number;
  attempts: number;
};

type ProgressResponse = {
  user_id: string;
  topics: TopicProgress[];
  total_topics: number;
  total_attempts: number;
  average_score: number;
  strongest_topic?: string | null;
  weakest_topic?: string | null;
};

export default function Dashboard() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [stage, setStage] = useState<"setup" | "video" | "quiz" | "result">(
    "setup"
  );

  const [video, setVideo] = useState<Video | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizEvaluationResponse | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your Study Buddy. Ask me any doubt about your topic here.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setUserId(parsed.id);

      fetch(`${API_BASE}/progress/recommend/${parsed.id}`)
        .then((res) => res.json())
        .then((data) => setAiSuggestion(data))
        .catch((err) => console.error("AI suggestion error:", err));

      fetchUserProgress(parsed.id);
    }
  }, []);

  const fetchUserProgress = async (uid: string) => {
  try {
    console.log("Fetching progress for user:", uid);

    const res = await fetch(`${API_BASE}/progress/${uid}`);
    const data = await res.json();

    console.log("Progress API status:", res.status);
    console.log("Progress API data:", data);

    if (res.ok) {
      setProgressData(data);
    }
  } catch (err) {
    console.error("Progress fetch error:", err);
  }
};

  const chartData = useMemo(() => {
    if (!progressData?.topics) return [];
    return progressData.topics.map((item) => {
      const avg =
        item.scores.length > 0
          ? item.scores.reduce((a, b) => a + b, 0) / item.scores.length
          : 0;

      return {
        topic: item.topic,
        averageScore: Number(avg.toFixed(1)),
        attempts: item.attempts,
        lastScore: item.last_score,
      };
    });
  }, [progressData]);

  const trendData = useMemo(() => {
    if (!progressData?.topics) return [];
    return progressData.topics.map((item, index) => ({
      index: index + 1,
      topic: item.topic,
      lastScore: item.last_score,
    }));
  }, [progressData]);

  const startLearning = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommend/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, difficulty, score: 0 }),
      });

      const data = await res.json();
      setRecommendation(data);
      setVideo(data.videos?.[0] || null);
      setResult(null);
      setQuiz([]);
      setAnswers([]);
      setStage("video");
    } catch (err) {
      console.error("Start learning error:", err);
      alert("Failed to fetch recommended videos");
    } finally {
      setLoading(false);
    }
  };

  const goToQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await res.json();
      setQuiz(data.questions || []);
      setAnswers(new Array((data.questions || []).length).fill(""));
      setStage("quiz");
    } catch (err) {
      console.error("Quiz generation error:", err);
      alert("Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelect = (questionIndex: number, option: string) => {
    const updated = [...answers];
    updated[questionIndex] = option[0].toUpperCase();
    setAnswers(updated);
  };

  const submitQuiz = async () => {
    if (answers.some((a) => !a)) {
      alert("Please answer all questions");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quiz/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty,
          questions: quiz,
          user_answers: answers,
        }),
      });

      const data: QuizEvaluationResponse = await res.json();
      setResult(data);

      if (userId) {
        await fetch(`${API_BASE}/progress/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            topic,
            score: data.score,
            difficulty,
            next_difficulty: data.next_difficulty,
          }),
        });

        await fetchUserProgress(userId);

        fetch(`${API_BASE}/progress/recommend/${userId}`)
          .then((res) => res.json())
          .then((data) => setAiSuggestion(data))
          .catch((err) => console.error("AI suggestion refresh error:", err));
      }

      const rec = await fetch(`${API_BASE}/recommend/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty: data.next_difficulty,
          score: data.score,
        }),
      });

      const recData = await rec.json();
      setRecommendation(recData);
      setVideo(recData.videos?.[0] || null);
      setDifficulty(data.next_difficulty);
      setStage("result");
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("Failed to evaluate quiz");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const msg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, message: msg }),
      });

      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I couldn't answer that right now.",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to chatbot right now.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }

      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.replace("/", "");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }

      return null;
    } catch {
      return null;
    }
  };

  const resetFlow = () => {
    setStage("setup");
    setVideo(null);
    setQuiz([]);
    setAnswers([]);
    setResult(null);
    setRecommendation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex">
      <div className="w-2/3 p-8 space-y-6 overflow-y-auto">
        <div className="animate-fadeIn transition-all duration-500 ease-in-out transform hover:scale-[1.01] backdrop-blur-lg bg-white/20 p-6 rounded-2xl shadow-xl text-white border border-white/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2"> AI Study Buddy</h1>
              <p className="text-white/80">
                Learn with videos, attempt quizzes, and improve with adaptive recommendations.
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>
          </div>

          {aiSuggestion?.recommended_topic && (
            <div className="mt-5 bg-yellow-300/90 text-black p-4 rounded-xl shadow">
              <p className="font-semibold"> AI Suggestion</p>
              <p>
                Focus on:{" "}
                <span className="font-bold">{aiSuggestion.recommended_topic}</span>
              </p>
              <p className="text-sm">{aiSuggestion.reason}</p>
              <button
                onClick={() => setTopic(aiSuggestion.recommended_topic)}
                className="mt-3 bg-black text-white px-4 py-2 rounded-lg"
              >
                Use This Topic
              </button>
            </div>
          )}

          {progressData ? (
  <div className="mt-5 bg-white/10 p-4 rounded-xl">
    <h2 className="text-xl font-bold mb-3">Your Learning Progress</h2>

    {progressData.topics?.length > 0 ? (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-sm text-white/80">Total Topics</p>
            <p className="text-2xl font-bold">{progressData.total_topics}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-sm text-white/80">Attempts</p>
            <p className="text-2xl font-bold">{progressData.total_attempts}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-sm text-white/80">Average Score</p>
            <p className="text-2xl font-bold">{progressData.average_score}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-sm text-white/80">Strongest Topic</p>
            <p className="text-lg font-bold">
              {progressData.strongest_topic || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-3 text-black">
            <h3 className="font-semibold mb-3">Average Score by Topic</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 text-black">
            <h3 className="font-semibold mb-3">Latest Score Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="lastScore"
                    stroke="#ec4899"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3 max-h-56 overflow-y-auto">
          {progressData.topics.map((item, index) => (
            <div
              key={index}
              className="bg-white/10 p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.topic}</p>
                <p className="text-sm text-gray-200">
                  Scores: {item.scores.join(", ")}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm">Difficulty: {item.current_difficulty}</p>
                <p className="text-sm">Attempts: {item.attempts}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <p className="text-white/80">
        No progress yet. Complete one quiz to see charts and topic history.
      </p>
    )}
  </div>
) : null}

          {stage === "setup" && (
            <div className="space-y-4 mt-5 animate-fadeIn">
              <input
                placeholder="Enter topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/85 text-black outline-none"
              />

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/85 text-black outline-none"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>

              <button
                onClick={startLearning}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Start Learning"
                )}
              </button>
            </div>
          )}
        </div>

        {stage === "video" && video && (
          <div className="animate-fadeIn transition-all duration-500 ease-in-out transform hover:scale-[1.01] backdrop-blur-lg bg-white/20 p-6 rounded-2xl text-white shadow-xl border border-white/20">
            <h2 className="text-2xl font-semibold mb-2">{video.title}</h2>
            <p className="text-white/80 mb-4">
              Topic: <span className="font-semibold">{topic}</span> | Difficulty:{" "}
              <span className="font-semibold">{difficulty}</span>
            </p>

            {getEmbedUrl(video.url) ? (
              <iframe
                src={getEmbedUrl(video.url)!}
                className="w-full h-80 rounded-xl border border-white/20"
                allowFullScreen
                title={video.title}
              />
            ) : (
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-semibold"
              >
                Open Video
              </a>
            )}

            <div className="mt-4 flex gap-3 flex-wrap">
              <button
                onClick={goToQuiz}
                disabled={quizLoading}
                className="bg-green-400 text-black px-6 py-3 rounded-xl font-semibold disabled:opacity-70"
              >
                {quizLoading ? "Generating Quiz..." : "Next → Quiz"}
              </button>

              <button
                onClick={resetFlow}
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl"
              >
                Change Topic
              </button>
            </div>
          </div>
        )}

        {stage === "quiz" && (
          <div className="animate-fadeIn transition-all duration-500 ease-in-out transform hover:scale-[1.01] backdrop-blur-lg bg-white/20 p-6 rounded-2xl text-white shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold mb-5">📝 Quiz</h2>

            {quiz.map((q, i) => (
              <div key={i} className="mb-6 bg-white/10 p-4 rounded-xl">
                <p className="font-semibold mb-3">
                  {i + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className="block bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === opt[0]}
                        onChange={() => handleSelect(i, opt)}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={submitQuiz}
              disabled={submitLoading}
              className="bg-purple-400 text-black px-6 py-3 rounded-xl font-semibold disabled:opacity-70"
            >
              {submitLoading ? "Evaluating..." : "Submit Quiz"}
            </button>
          </div>
        )}

        {stage === "result" && result && (
          <div className="animate-fadeIn transition-all duration-500 ease-in-out transform hover:scale-[1.01] backdrop-blur-lg bg-white/20 p-6 rounded-2xl text-white shadow-xl border border-white/20">
            <h2 className="text-3xl font-bold mb-3"> Score: {result.score}/10</h2>
            <p className="text-lg mb-2">{result.feedback}</p>
            <p className="text-sm text-white/80 mb-4">
              {recommendation?.reason || "Next video recommended based on your performance."}
            </p>

            {video && (
              <div className="mb-4 bg-white/10 p-4 rounded-xl">
                <p className="font-semibold mb-2">Next Recommended Video</p>
                <p>{video.title}</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setStage("video")}
                className="bg-blue-400 text-black px-6 py-3 rounded-xl font-semibold"
              >
                Next Video
              </button>

              <button
                onClick={resetFlow}
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl"
              >
                New Topic
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-1/3 p-4 flex flex-col bg-black/30 backdrop-blur-lg text-white border-l border-white/10">
        <h2 className="text-xl font-bold mb-3">💬 AI Chat</h2>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl max-w-[85%] ${
                msg.role === "user"
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-white/15 text-white"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {chatLoading && (
            <div className="bg-white/15 text-white p-3 rounded-2xl max-w-[85%]">
              AI is typing...
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="w-full p-3 rounded-xl text-black outline-none"
            placeholder="Ask your doubt..."
          />

          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-xl font-semibold disabled:opacity-70"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}