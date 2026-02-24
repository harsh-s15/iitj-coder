import { useEffect, useMemo, useState } from "react";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import QuestionPage from "./components/QuestionPage";
import { login, fetchQuestions, submitCode, fetchProfile, logout } from "./services/api";
import { connectWebSocket, disconnectWebSocket } from "./services/socket";

const CODE_CACHE_KEY = "lab_question_code_cache_v1";
const SERVER_CODE_SAVE_KEY = "lab_server_code_save_v1";
const DARK_MODE_KEY = "lab_dark_mode_v1";
const SUBMISSION_HISTORY_KEY = "lab_submission_history_v1";

const readCodeCache = () => {
        try {
                const raw = window.localStorage.getItem(CODE_CACHE_KEY);
                if (!raw) {
                        return {};
                }
                const parsed = JSON.parse(raw);
                return typeof parsed === "object" && parsed !== null ? parsed : {};
        } catch {
                return {};
        }
};

const readSubmissionHistory = () => {
        try {
                const raw = window.localStorage.getItem(SUBMISSION_HISTORY_KEY);
                if (!raw) {
                        return {};
                }
                const parsed = JSON.parse(raw);
                return typeof parsed === "object" && parsed !== null ? parsed : {};
        } catch {
                return {};
        }
};

function App() {
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [isAuthenticating, setIsAuthenticating] = useState(true);
        const [selectedQuestionId, setSelectedQuestionId] = useState(null);
        const [codeByQuestionId, setCodeByQuestionId] = useState(readCodeCache);
        const [submissionHistoryByQuestion, setSubmissionHistoryByQuestion] =
                useState(readSubmissionHistory);
        const [questions, setQuestions] = useState([]);
        const [userProfile, setUserProfile] = useState({
                name: "Student User",
                email: "student@iitj.ac.in",
        });

        useEffect(() => {
                const checkSession = async () => {
                        try {
                                const user = await fetchProfile();
                                setIsLoggedIn(true);
                                setUserProfile({
                                        name: user.username,
                                        email: user.email || `${user.username}@iitj.ac.in`,
                                });
                        } catch (err) {
                                console.log("Not authenticated on mount", err);
                        } finally {
                                setIsAuthenticating(false);
                        }
                };
                checkSession();
        }, []);
        const [isDarkMode, setIsDarkMode] = useState(() => {
                try {
                        return window.localStorage.getItem(DARK_MODE_KEY) === "true";
                } catch {
                        return false;
                }
        });

        const selectedQuestion = useMemo(
                () =>
                        questions.find((question) => String(question.id) === String(selectedQuestionId)) ||
                        null,
                [selectedQuestionId, questions],
        );

        const navigateTo = (path) => {
                const nextHash = `#${path}`;
                if (window.location.hash !== nextHash) {
                        window.location.hash = nextHash;
                }
        };

        const handleLogin = async (payload) => {
                try {
                        const user = await login(payload.email, payload.password);
                        setIsLoggedIn(true);
                        setUserProfile({
                                name: user.username,
                                email: user.email || `${user.username}@iitj.ac.in`,
                        });
                        navigateTo("/home");
                } catch (err) {
                        alert("Login failed: " + err.message);
                }
        };

        const handleLogout = async () => {
                try {
                        await logout();
                } catch (err) {
                        console.error("Logout API failed", err);
                }
                setIsLoggedIn(false);
                setSelectedQuestionId(null);
                disconnectWebSocket();
                navigateTo("/login");
        };

        const handleSelectQuestion = (questionId) => {
                setSelectedQuestionId(questionId);
                navigateTo(`/question/${questionId}`);
        };

        const handleHome = () => {
                setSelectedQuestionId(null);
                navigateTo("/home");
        };

        const handleGoToPreviousQuestion = () => {
                if (!selectedQuestionId) {
                        return;
                }
                const index = questions.findIndex(
                        (question) => String(question.id) === String(selectedQuestionId),
                );
                if (index <= 0) {
                        return;
                }
                handleSelectQuestion(questions[index - 1].id);
        };

        const handleGoToNextQuestion = () => {
                if (!selectedQuestionId) {
                        return;
                }
                const index = questions.findIndex(
                        (question) => String(question.id) === String(selectedQuestionId),
                );
                if (index === -1 || index >= questions.length - 1) {
                        return;
                }
                handleSelectQuestion(questions[index + 1].id);
        };

        const handleCodeChange = (nextCode) => {
                if (!selectedQuestionId) {
                        return;
                }

                setCodeByQuestionId((previous) => ({
                        ...previous,
                        [selectedQuestionId]: nextCode,
                }));
        };

        const getQuestionById = (questionId) =>
                questions.find((question) => String(question.id) === String(questionId)) || null;

        const getCurrentCodeForQuestion = (questionId) => {
                const question = getQuestionById(questionId);
                return codeByQuestionId[questionId] ?? question?.starterCode ?? "";
        };

        const handleSaveCode = async (questionId) => {
                const payload = {
                        questionId,
                        code: getCurrentCodeForQuestion(questionId),
                        savedAt: new Date().toISOString(),
                };

                // TODO: Implement server-side save if needed. For now, local storage + server-side submission is enough.
                await new Promise((resolve) => {
                        window.setTimeout(resolve, 500);
                });

                let previousSaved = {};
                try {
                        const previousRaw = window.localStorage.getItem(
                                SERVER_CODE_SAVE_KEY,
                        );
                        previousSaved = previousRaw ? JSON.parse(previousRaw) : {};
                } catch {
                        previousSaved = {};
                }
                const nextSaved = {
                        ...previousSaved,
                        [questionId]: payload,
                };
                window.localStorage.setItem(
                        SERVER_CODE_SAVE_KEY,
                        JSON.stringify(nextSaved),
                );
        };

        const handleResetCode = (questionId) => {
                const question = getQuestionById(questionId);
                if (!question) {
                        return;
                }

                setCodeByQuestionId((previous) => ({
                        ...previous,
                        [questionId]: question.starterCode || "",
                }));
        };

        const handleSubmitCode = async (questionId, submittedCode, language, type = "SUBMISSION", customInput = "") => {
                try {
                        const submission = await submitCode(questionId, submittedCode, language, type, customInput);
                        // Initially add with "PENDING" status
                        const nextSubmission = {
                                ...submission,
                                testResults: [], // Results will come via WebSocket
                                status: "PENDING",
                        };

                        setSubmissionHistoryByQuestion((previous) => ({
                                ...previous,
                                [questionId]: [
                                        nextSubmission,
                                        ...(previous[questionId] || []),
                                ],
                        }));
                } catch (err) {
                        alert("Submission failed: " + err.message);
                }
        };

        useEffect(() => {
                if (isLoggedIn) {
                        fetchQuestions().then(setQuestions).catch(console.error);
                        connectWebSocket((update) => {
                                setSubmissionHistoryByQuestion((prev) => {
                                        const questionId = update.questionId;
                                        const history = prev[questionId] || [];
                                        const updatedHistory = history.map((sub) =>
                                                sub.id === update.id ? { ...sub, ...update } : sub
                                        );
                                        return { ...prev, [questionId]: updatedHistory };
                                });
                        });
                }
        }, [isLoggedIn]);

        useEffect(() => {
                const applyRoute = () => {
                        const route = window.location.hash.replace(/^#/, "") || "/login";

                        if (!isLoggedIn) {
                                setSelectedQuestionId(null);
                                if (route !== "/login") {
                                        navigateTo("/login");
                                }
                                return;
                        }

                        if (route === "/home" || route === "/login") {
                                setSelectedQuestionId(null);
                                return;
                        }

                        if (route.startsWith("/question/")) {
                                const routeQuestionId = route.replace("/question/", "");
                                setSelectedQuestionId(routeQuestionId);
                                return;
                        }

                        navigateTo("/home");
                };

                applyRoute();
                window.addEventListener("hashchange", applyRoute);
                return () => {
                        window.removeEventListener("hashchange", applyRoute);
                };
        }, [isLoggedIn]);

        useEffect(() => {
                window.localStorage.setItem(
                        CODE_CACHE_KEY,
                        JSON.stringify(codeByQuestionId),
                );
        }, [codeByQuestionId]);

        useEffect(() => {
                window.localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
        }, [isDarkMode]);

        useEffect(() => {
                window.localStorage.setItem(
                        SUBMISSION_HISTORY_KEY,
                        JSON.stringify(submissionHistoryByQuestion),
                );
        }, [submissionHistoryByQuestion]);

        if (isAuthenticating) {
                return (
                        <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-mono">
                                <div className="animate-pulse">Verifying Session...</div>
                        </div>
                );
        }

        if (!isLoggedIn) {
                return <LoginForm onLogin={handleLogin} />;
        }

        if (!selectedQuestion) {
                return (
                        <HomePage
                                questions={questions}
                                onSelectQuestion={handleSelectQuestion}
                                onLogout={handleLogout}
                        />
                );
        }

        const submissionsForSelectedQuestion =
                submissionHistoryByQuestion[selectedQuestion.id] || [];

        return (
                <QuestionPage
                        question={selectedQuestion}
                        questionIndex={questions.findIndex(
                                (item) => item.id === selectedQuestion.id,
                        )}
                        totalQuestions={questions.length}
                        code={
                                codeByQuestionId[selectedQuestion.id] ??
                                selectedQuestion.starterCode
                        }
                        onCodeChange={handleCodeChange}
                        onSaveCode={handleSaveCode}
                        onResetCode={handleResetCode}
                        onSubmitCode={handleSubmitCode}
                        submissions={submissionsForSelectedQuestion}
                        onHome={handleHome}
                        onPreviousQuestion={handleGoToPreviousQuestion}
                        onNextQuestion={handleGoToNextQuestion}
                        onLogout={handleLogout}
                        onToggleDarkMode={() => setIsDarkMode((previous) => !previous)}
                        isDarkMode={isDarkMode}
                        userProfile={userProfile}
                />
        );
}

export default App;
