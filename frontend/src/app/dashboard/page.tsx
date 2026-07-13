"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import {
  Play,
  Send,
  BookOpen,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  LogOut,
  BrainCircuit,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

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

const difficultyColor: Record<string, string> = {
  easy: "#22d3a5",
  medium: "#f59e42",
  hard: "#f43f5e",
};

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 7 ? "#22d3ee" : score >= 4 ? "#f59e42" : "#f43f5e";
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold border"
      style={{
        background: `${color}15`,
        color,
        borderColor: `${color}40`,
      }}
    >
      {score}/10
    </span>
  );
};

export default function Dashboard() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [stage, setStage] = useState<"setup" | "video" | "quiz">("setup");

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
        "Hi! I'm your AI Study Buddy. Ask me anything about your current topic.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

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
      const res = await fetch(`${API_BASE}/progress/${uid}`);
      const data = await res.json();
      if (res.ok) setProgressData(data);
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

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const resetFlow = () => {
    setStage("setup");
    setVideo(null);
    setQuiz([]);
    setAnswers([]);
    setResult(null);
    setRecommendation(null);
    setQuizSubmitted(false);
    setShowAnswers(false);
  };

  const startLearning = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recommend/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, score: 0 }),
      });

      const data = await res.json();
      setRecommendation(data);
      setVideo(data.videos?.[0] || null);
      setResult(null);
      setQuiz([]);
      setAnswers([]);
      setQuizSubmitted(false);
      setShowAnswers(false);
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
      setQuizSubmitted(false);
      setShowAnswers(false);
      setResult(null);
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
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          .catch((err) =>
            console.error("AI suggestion refresh error:", err)
          );
      }

      const rec = await fetch(`${API_BASE}/recommend/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setQuizSubmitted(true);
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
        headers: { "Content-Type": "application/json" },
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

  const retryQuiz = () => {
    setAnswers(new Array(quiz.length).fill(""));
    setQuizSubmitted(false);
    setShowAnswers(false);
    setResult(null);
    setStage("quiz");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    try {
      if (url.includes("youtube.com/embed/")) {
        return url;
      }

      const parsed = new URL(url);

      if (parsed.hostname.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;

        const paths = parsed.pathname.split("/");
        const embedIndex = paths.indexOf("embed");
        if (embedIndex !== -1 && paths[embedIndex + 1]) {
          return `https://www.youtube.com/embed/${paths[embedIndex + 1]}`;
        }
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

        .font-syne { font-family: 'Syne', sans-serif; }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }

        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-screen overflow-hidden">
        <aside className="hidden lg:flex w-20 flex-col items-center py-8 border-r border-white/5 bg-[#020617]/50 backdrop-blur-xl">
          <div className="mb-10 p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>

          <div className="flex flex-col gap-8 text-slate-500 items-center">
            <Settings className="w-6 h-6 hover:text-indigo-400 cursor-pointer transition-colors" title="Settings" />
            <HelpCircle className="w-6 h-6 hover:text-indigo-400 cursor-pointer transition-colors" title="Help" />
            <Info
              className="w-6 h-6 hover:text-indigo-400 cursor-pointer transition-colors"
              title="About AI Study Buddy"
              onClick={() => setShowAboutModal(true)}
            />
            <LogOut
              className="w-6 h-6 hover:text-rose-500 cursor-pointer transition-colors"
              title="Logout"
              onClick={handleLogout}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-syne font-extrabold text-white tracking-tight">
                AI Study{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-extrabold">
                  Buddy
                </span>
              </h1>
              <p className="text-slate-400 mt-1 font-medium">
                Adaptive learning with videos, quizzes and AI coaching.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                  System Ready
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="lg:hidden px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold"
              >
                Sign out
              </button>
            </div>
          </header>



          {progressData && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-indigo-400" />
                <h2 className="text-xl font-syne font-bold text-white">
                  Performance Analytics
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: "Active Topics",
                    value: progressData.total_topics,
                    color: "text-indigo-400",
                  },
                  {
                    label: "Total Sessions",
                    value: progressData.total_attempts,
                    color: "text-purple-400",
                  },
                  {
                    label: "Avg Mastery",
                    value: `${progressData.average_score}/10`,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Best Topic",
                    value: progressData.strongest_topic || "N/A",
                    color: "text-amber-400",
                  },
                ].map((stat, i) => (
                  <div key={i} className="glass p-6 rounded-3xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {progressData.topics?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-[32px] h-[350px]">
                      <h4 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">
                        Learning Curve
                      </h4>
                      <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorScore"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6366f1"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#6366f1"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                          />
                          <XAxis
                            dataKey="topic"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 10]}
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="averageScore"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass p-6 rounded-[32px] h-[350px]">
                      <h4 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">
                        Engagement by Topic
                      </h4>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="topic"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.02)" }}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                            }}
                          />
                          <Bar
                            dataKey="attempts"
                            fill="#818cf8"
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass rounded-[32px] p-6">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <h4 className="text-lg font-syne font-bold text-white">
                        Topic Progress
                      </h4>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Latest learning status
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {progressData.topics.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h5 className="font-semibold text-white text-base">
                                {item.topic}
                              </h5>
                              <ScoreBadge score={item.last_score} />
                            </div>
                            <p className="text-sm text-slate-400">
                              Scores: {item.scores.join(", ")}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold border capitalize"
                              style={{
                                color:
                                  difficultyColor[item.current_difficulty] ||
                                  "#94a3b8",
                                borderColor: `${
                                  difficultyColor[item.current_difficulty] ||
                                  "#94a3b8"
                                }40`,
                                background: `${
                                  difficultyColor[item.current_difficulty] ||
                                  "#94a3b8"
                                }15`,
                              }}
                            >
                              {item.current_difficulty}
                            </span>
                            <span className="text-sm text-slate-400">
                              {item.attempts} attempt
                              {item.attempts !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass rounded-[32px] p-10 text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    No progress yet
                  </h4>
                  <p className="text-slate-400">
                    Complete a quiz to see your analytics here.
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="glass rounded-[32px] overflow-hidden">
            {stage === "setup" && (
              <div className="p-8 md:p-12 max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-syne font-bold text-white">
                    What&apos;s on the agenda today?
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Pick a topic and difficulty to begin your session.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 ml-1 tracking-widest">
                      Target Topic
                    </label>
                    <input
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600"
                      placeholder="e.g. Binary Trees, React Hooks, Photosynthesis..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startLearning()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 ml-1 tracking-widest">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["easy", "medium", "hard"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                            difficulty === level
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-slate-900/50 border-white/5 text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={loading || !topic.trim()}
                    onClick={startLearning}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <>
                        Start Journey{" "}
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {stage === "video" && (
              <div className="p-6 md:p-8 space-y-6">
                {!video || !video.url ? (
                  <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-12 text-center space-y-4">
                    <div className="text-5xl">📺</div>
                    <h3 className="text-xl font-bold text-white font-syne">No videos available for this topic</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      We couldn't find any learning tutorials for "{topic}" at this moment. Try entering a different keyword or topic.
                    </p>
                    <button
                      onClick={resetFlow}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                    >
                      Try Another Topic
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                          <Play className="text-red-500 fill-red-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {video.title}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Curated Learning Content • {difficulty}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={goToQuiz}
                          disabled={quizLoading}
                          className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {quizLoading ? "Generating..." : "Ready for Quiz?"}
                        </button>

                        <button
                          onClick={resetFlow}
                          className="px-5 py-3 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold"
                        >
                          Change Topic
                        </button>
                      </div>
                    </div>

                    <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900/50">
                      <iframe
                        className="w-full h-full"
                        src={getEmbedUrl(video.url) || "https://www.youtube.com/embed/f2O6mQ1MEl8"}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title={video.title}
                      />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mt-2">
                      {recommendation?.reason ? (
                        <div className="glass rounded-2xl p-4 flex-1">
                          <p className="text-sm text-slate-400 leading-6">
                            {recommendation.reason}
                          </p>
                        </div>
                      ) : <div className="flex-1" />}

                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/30 text-red-400 font-bold transition-all text-sm h-full whitespace-nowrap active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-red-400" />
                        Open in YouTube
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {stage === "quiz" && (
              <div className="p-6 md:p-10 space-y-8">
                <div className="text-center max-w-xl mx-auto">
                  <span className="text-indigo-400 font-bold text-sm uppercase tracking-widest">
                    Challenge Phase
                  </span>
                  <h2 className="text-3xl font-syne font-bold text-white mt-2">
                    Testing your knowledge
                  </h2>
                </div>

                <div className="grid gap-6">
                  {quiz.map((q, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 rounded-[24px] p-6 space-y-4"
                    >
                      <p className="font-bold text-lg text-slate-200">
                        <span className="text-indigo-500 mr-2">
                          {idx + 1}.
                        </span>
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, optionIndex) => {
                          const isSelected =
                            answers[idx] === opt[0].toUpperCase();

                          return (
                            <button
                              key={`${idx}-${optionIndex}`}
                              onClick={() => !quizSubmitted && handleSelect(idx, opt)}
                              disabled={quizSubmitted}
                              className={`text-left p-4 rounded-xl border transition-all text-sm font-medium ${
                                isSelected
                                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                                  : "bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800"
                              } ${quizSubmitted ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!quizSubmitted && (
                    <button
                      onClick={submitQuiz}
                      disabled={submitLoading}
                      className="flex-1 bg-indigo-600 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitLoading ? (
                        <RefreshCw className="animate-spin" />
                      ) : (
                        "Submit Quiz"
                      )}
                    </button>
                  )}

                  {!quizSubmitted && (
                    <button
                      onClick={() => setStage("video")}
                      className="px-6 py-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-center"
                    >
                      Back to Video
                    </button>
                  )}
                </div>

                {quizSubmitted && result && (
                  <div className="bg-slate-900/80 border border-white/10 rounded-[32px] p-8 text-center space-y-6 mt-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-5 rounded-full pointer-events-none" />
                    
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Quiz Completed!
                      </span>
                      <h3 className="text-3xl font-syne font-black text-white">
                        Your Score: {result.score} / 10
                      </h3>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 text-sm font-semibold border border-white/10">
                        Status:{" "}
                        <span className={result.score >= 5 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {result.score >= 5 ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
                      {result.feedback}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                      <button
                        onClick={retryQuiz}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-2xl font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry Quiz
                      </button>

                      <button
                        onClick={() => setShowAnswers(!showAnswers)}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all w-full sm:w-auto shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <BookOpen className="w-4 h-4" />
                        {showAnswers ? "Hide Answers" : "View Answers"}
                      </button>
                      
                      <button
                        onClick={resetFlow}
                        className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl font-bold transition-all w-full sm:w-auto border border-white/5 active:scale-95"
                      >
                        New Topic
                      </button>
                    </div>

                    {showAnswers && (
                      <div className="text-left space-y-6 mt-8 border-t border-white/10 pt-6">
                        <h4 className="text-lg font-syne font-bold text-white mb-2">
                          Detailed Review
                        </h4>

                        <div className="space-y-4">
                          {quiz.map((q, idx) => {
                            const userAnswerKey = answers[idx]; // "A", "B", "C", "D"
                            const correctAnswerKey = q.answer; // "A", "B", "C", "D"
                            const isCorrect = userAnswerKey === correctAnswerKey;

                            return (
                              <div
                                key={idx}
                                className={`rounded-2xl border p-5 space-y-3 transition-all ${
                                  isCorrect
                                    ? "bg-emerald-500/5 border-emerald-500/10"
                                    : "bg-rose-500/5 border-rose-500/10"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                                        isCorrect
                                          ? "bg-emerald-500/25 text-emerald-400"
                                          : "bg-rose-500/25 text-rose-400"
                                      }`}
                                    >
                                      {idx + 1}
                                    </span>
                                    <p className="font-semibold text-slate-200 text-base">
                                      {q.question}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                      isCorrect
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-rose-500/10 text-rose-400"
                                    }`}
                                  >
                                    {isCorrect ? "Correct" : "Incorrect"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  {q.options.map((opt, optIdx) => {
                                    const optLetter = opt[0].toUpperCase();
                                    const isUserSelection = userAnswerKey === optLetter;
                                    const isCorrectOption = correctAnswerKey === optLetter;

                                    let optStyle = "bg-slate-950/40 border-white/5 text-slate-400";
                                    if (isCorrectOption) {
                                      optStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold";
                                    } else if (isUserSelection && !isCorrect) {
                                      optStyle = "bg-rose-500/10 border-rose-500/30 text-rose-300 font-semibold";
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-3 rounded-xl border text-sm ${optStyle}`}
                                      >
                                        {opt}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="w-full lg:w-[400px] border-l border-white/5 bg-[#020617]/80 backdrop-blur-3xl flex flex-col h-[500px] lg:h-full relative shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <BrainCircuit size={20} />
              </div>
              <span className="font-bold text-white font-syne">AI Coach</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-lg"
                      : "bg-slate-900 border border-white/5 text-slate-300 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChat();
              }}
              className="relative"
            >
              <input
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:border-indigo-500/50 text-sm transition-all text-white placeholder:text-slate-600"
                placeholder="Ask a doubt..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] max-w-2xl w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-200">
            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Info size={20} />
                </div>
                <h3 className="text-2xl font-syne font-bold text-white">
                  About AI Study Buddy
                </h3>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
              <div className="space-y-3">
                <h4 className="font-bold text-white text-base">🚀 Platform Features</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-indigo-300 text-sm">🎥 Curated Video Lessons</span>
                    <p className="text-xs text-slate-400">Watch high-quality, fully embedded educational videos directly inside the workspace.</p>
                  </li>
                  <li className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-indigo-300 text-sm">📝 Adaptive Quizzes</span>
                    <p className="text-xs text-slate-400">Challenge yourself with dynamic quizzes that automatically adjust difficulty based on your score.</p>
                  </li>
                  <li className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-indigo-300 text-sm">💬 AI Coach</span>
                    <p className="text-xs text-slate-400">Chat with a dedicated AI tutor to ask questions, explain code, or brainstorm concepts.</p>
                  </li>
                  <li className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-indigo-300 text-sm">📊 Performance Analytics</span>
                    <p className="text-xs text-slate-400">Track and visualize your study sessions, difficulty levels, and concept mastery curves.</p>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-4">
                <h4 className="font-bold text-white text-base">📈 Understanding the Charts</h4>
                <div className="space-y-3">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-purple-300 text-sm flex items-center gap-1.5">
                      <TrendingUp size={16} /> Learning Curve Graph
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The Learning Curve plots your recent quiz scores over time. An upward-trending curve indicates increasing topic mastery and knowledge retention. Steady performance at higher difficulties signifies complete subject command.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="font-semibold text-purple-300 text-sm flex items-center gap-1.5">
                      <BookOpen size={16} /> Engagement (Active Topics & Sessions)
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This represents your study patterns. Total Sessions records each time you run a study flow. Engagement by Topic counts your total quiz attempts and difficulty transitions per topic, identifying focus areas and habit consistency.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}