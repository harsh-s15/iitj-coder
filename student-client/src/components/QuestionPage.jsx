import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import MarkdownRenderer from "./MarkdownRenderer";

const getBadgeClass = (status) => {
        const s = status ? status.toUpperCase() : "";
        if (s === "PASSED" || s === "FINISHED" || s === "ACCEPTED") {
                return "bg-emerald-100 text-emerald-700";
        }
        if (s === "FAILED" || s === "WRONG_ANSWER" || s === "ERROR") {
                return "bg-red-100 text-red-700";
        }
        if (s === "RUNNING" || s === "PROCESSING" || s === "PENDING") {
                return "bg-amber-100 text-amber-700";
        }
        return "bg-slate-100 text-slate-700";
};

function QuestionPage({
        question,
        questionIndex,
        totalQuestions,
        code,
        onCodeChange,
        onSaveCode,
        onResetCode,
        onSubmitCode,
        submissions,
        onHome,
        onPreviousQuestion,
        onNextQuestion,
        onLogout,
        onToggleDarkMode,
        isDarkMode,
        userProfile,
}) {
        const [statusText, setStatusText] = useState("");
        const [testStatuses, setTestStatuses] = useState({});
        const [testOutputs, setTestOutputs] = useState({});
        const [expandedTestCases, setExpandedTestCases] = useState({});
        const [expandedResultCases, setExpandedResultCases] = useState({});
        const [isSaving, setIsSaving] = useState(false);
        const [customInput, setCustomInput] = useState("");
        const [customOutput, setCustomOutput] = useState("");
        const [isRunningCustom, setIsRunningCustom] = useState(false);
        const [leftPanelWidth, setLeftPanelWidth] = useState(47);
        const [isResizing, setIsResizing] = useState(false);
        const [activeTab, setActiveTab] = useState("description");
        const [resultPrompt, setResultPrompt] = useState("");
        const [isProfileOpen, setIsProfileOpen] = useState(false);
        const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
        const [isRunningVisible, setIsRunningVisible] = useState(false);
        const lastSwitchedSubmissionId = useRef(null);
        const containerRef = useRef(null);
        const testCasesRef = useRef(null);

        const allTestCases = useMemo(() => {
                if (question.visibleTestCasesJson) {
                        try {
                                return JSON.parse(question.visibleTestCasesJson);
                        } catch (e) {
                                console.error("Failed to parse visibleTestCasesJson", e);
                        }
                }
                return question.testCases || [];
        }, [question.visibleTestCasesJson, question.testCases]);

        const visibleTestCases = useMemo(() => {
                return allTestCases
                        .map((testCase, index) => ({ ...testCase, index }))
                        .filter((testCase) => !testCase.hidden);
        }, [allTestCases]);

        const actualSubmissions = useMemo(() => {
                return submissions.filter((s) => s.type === "SUBMISSION");
        }, [submissions]);

        const selectedSubmission = useMemo(() => {
                if (!actualSubmissions.length) {
                        return null;
                }
                if (!selectedSubmissionId) {
                        return actualSubmissions[0];
                }
                return (
                        actualSubmissions.find((item) => String(item.id) === String(selectedSubmissionId)) ||
                        actualSubmissions[0]
                );
        }, [actualSubmissions, selectedSubmissionId]);

        const latestVisibleRun = useMemo(() => {
                return submissions.find((s) => s.type === "RUN_VISIBLE");
        }, [submissions]);

        const latestCustomRun = useMemo(() => {
                return submissions.find((s) => s.type === "RUN_CUSTOM");
        }, [submissions]);

        const visibleRunOutputMap = useMemo(() => {
                if (!latestVisibleRun || !latestVisibleRun.resultMetadata) {
                        return {};
                }
                try {
                        const results = JSON.parse(latestVisibleRun.resultMetadata);
                        if (Array.isArray(results)) {
                                return Object.fromEntries(
                                        results.map((r) => {
                                                const status = r.status || (r.passed ? "PASSED" : "FAILED");
                                                const idx = r.index !== undefined ? r.index : (r.testCase !== undefined ? r.testCase - 1 : -1);
                                                return [idx, { ...r, status }];
                                        })
                                );
                        }
                } catch (e) {
                        console.error("Failed to parse latestVisibleRun results", e);
                }
                return {};
        }, [latestVisibleRun]);

        const customOutputResultValue = useMemo(() => {
                if (!latestCustomRun || !latestCustomRun.resultMetadata) {
                        return null;
                }
                try {
                        const parsed = JSON.parse(latestCustomRun.resultMetadata);
                        return parsed.output || parsed.error || null;
                } catch {
                        return null;
                }
        }, [latestCustomRun]);

        const { visibleResults, hiddenResults, submissionScore } = useMemo(() => {
                if (!selectedSubmission) {
                        return { visibleResults: [], hiddenResults: [], submissionScore: 0 };
                }

                let results = [];
                let totalTestCases = 0;

                if (selectedSubmission.resultMetadata) {
                        try {
                                const parsed = JSON.parse(selectedSubmission.resultMetadata);
                                if (Array.isArray(parsed)) {
                                        results = parsed;
                                        totalTestCases = results.length;
                                } else if (parsed && typeof parsed === "object") {
                                        results = parsed.results || [];
                                        totalTestCases = parsed.total || results.length;
                                }

                                results = results.map((r) => ({
                                        ...r,
                                        status: r.status || (r.passed ? "PASSED" : "FAILED"),
                                }));
                        } catch (e) {
                                console.error("Failed to parse resultMetadata", e);
                        }
                }

                const visible = results.filter((r) => r.type !== "hidden");
                const hidden = results.filter((r) => r.type === "hidden");

                const passedCount = results.filter((r) => r.status === "PASSED").length;
                const score = totalTestCases > 0 ? Math.round((passedCount / totalTestCases) * 100) : 0;

                // For completely passed submissions, ensure it shows 100% even if metadata is slightly off
                const finalScore = selectedSubmission.status === "ACCEPTED" ? 100 : score;

                return { visibleResults: visible, hiddenResults: hidden, submissionScore: finalScore };
        }, [selectedSubmission]);

        useEffect(() => {
                setTestStatuses({});
                setTestOutputs({});
                setStatusText("");
                setExpandedTestCases({});
                setExpandedResultCases({});
                setCustomInput("");
                setCustomOutput("");
                setActiveTab("description");
                setResultPrompt("");
                setIsProfileOpen(false);
                setSelectedSubmissionId(null);
        }, [question.id]);

        useEffect(() => {
                if (submissions.length > 0) {
                        const latest = submissions[0];
                        // Auto-switch to result tab ONLY for Submissions and ONLY when newly created (PENDING)
                        if (latest.type === "SUBMISSION" && latest.status === "PENDING" && lastSwitchedSubmissionId.current !== latest.id) {
                                lastSwitchedSubmissionId.current = latest.id;
                                setActiveTab("result");
                                setResultPrompt("");
                                setSelectedSubmissionId(latest.id);
                        }
                }
        }, [submissions]);

        useEffect(() => {
                const latestCustomStatus = latestCustomRun?.status;
                if (latestCustomStatus !== "PENDING" && latestCustomStatus !== "PROCESSING") {
                        setIsRunningCustom(false);
                }

                const latestVisibleStatus = latestVisibleRun?.status;
                if (latestVisibleStatus !== "PENDING" && latestVisibleStatus !== "PROCESSING") {
                        setIsRunningVisible(false);
                }
        }, [latestCustomRun, latestVisibleRun]);

        useEffect(() => {
                if (!isResizing) {
                        return undefined;
                }

                const handleMouseMove = (event) => {
                        if (!containerRef.current) {
                                return;
                        }
                        const rect = containerRef.current.getBoundingClientRect();
                        const rawWidth = ((event.clientX - rect.left) / rect.width) * 100;
                        const nextWidth = Math.min(70, Math.max(30, rawWidth));
                        setLeftPanelWidth(nextWidth);
                };

                const handleMouseUp = () => {
                        setIsResizing(false);
                };

                window.addEventListener("mousemove", handleMouseMove);
                window.addEventListener("mouseup", handleMouseUp);

                return () => {
                        window.removeEventListener("mousemove", handleMouseMove);
                        window.removeEventListener("mouseup", handleMouseUp);
                };
        }, [isResizing]);

        const handleSave = async () => {
                setIsSaving(true);
                setStatusText("Saving code to server...");
                try {
                        await onSaveCode(question.id);
                        setStatusText("Code saved to server.");
                } catch {
                        setStatusText("Failed to save code to server.");
                } finally {
                        setIsSaving(false);
                }
        };

        const handleSubmit = () => {
                onSubmitCode(question.id, code, "cpp", "SUBMISSION");
        };

        const handleReset = () => {
                const confirmed = window.confirm(
                        "Reset code to starter template for this question?",
                );
                if (!confirmed) {
                        return;
                }
                onResetCode(question.id);
                setStatusText("Code reset to starter template.");
        };

        const handleRunCode = () => {
                setStatusText("Enqueuing visible test cases run...");
                setIsRunningVisible(true);
                onSubmitCode(question.id, code, "cpp", "RUN_VISIBLE");
        };

        const handleRunCustomInput = () => {
                if (!customInput.trim()) {
                        alert("Please provide custom input.");
                        return;
                }
                setIsRunningCustom(true);
                setCustomOutput("Execution enqueued...");
                onSubmitCode(question.id, code, "cpp", "RUN_CUSTOM", customInput);
        };

        const handleSelectDescription = () => {
                setActiveTab("description");
                setResultPrompt("");
        };

        const handleSelectResult = () => {
                setActiveTab("result");
                if (!actualSubmissions.length) {
                        setResultPrompt("Submit code first to view results.");
                        return;
                }
                setResultPrompt("");
        };

        const toggleTestCase = (index) => {
                setExpandedTestCases((previous) => ({
                        ...previous,
                        [index]: !previous[index],
                }));
        };

        const toggleResultCase = (index) => {
                setExpandedResultCases((previous) => ({
                        ...previous,
                        [index]: !previous[index],
                }));
        };
        const renderDescriptionTab = () => (
                <>
                        <MarkdownRenderer content={question.description} />

                        <div ref={testCasesRef} className="mt-8">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-800">
                                                Visible Test Cases
                                        </h3>
                                        <button
                                                type="button"
                                                onClick={handleRunCode}
                                                disabled={isRunningVisible}
                                                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                                {isRunningVisible ? "Running..." : "Run Code"}
                                        </button>
                                </div>
                                <div className="space-y-3">
                                        {visibleTestCases.map((testCase, index) => {
                                                const status = testStatuses[testCase.index] || "idle";
                                                const isExpanded = !!expandedTestCases[testCase.index];
                                                return (
                                                        <div
                                                                key={`${question.id}-visible-${index}`}
                                                                className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                                        >
                                                                <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                                toggleTestCase(testCase.index)
                                                                        }
                                                                        className="mb-2 flex w-full items-center justify-between text-left"
                                                                >
                                                                        <p className="font-semibold text-slate-800">
                                                                                Test case {index + 1}
                                                                        </p>
                                                                        <span
                                                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass(
                                                                                        visibleRunOutputMap[testCase.index]?.status || (isRunningVisible ? "PROCESSING" : "idle"),
                                                                                )}`}
                                                                        >
                                                                                {visibleRunOutputMap[testCase.index]?.status || (isRunningVisible ? "PROCESSING" : "idle")}
                                                                        </span>
                                                                </button>

                                                                {isExpanded && (
                                                                        <div className="space-y-2">
                                                                                <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                Input
                                                                                        </p>
                                                                                        <p className="font-mono text-sm text-slate-700">
                                                                                                {testCase.input}
                                                                                        </p>
                                                                                </div>
                                                                                <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                Expected Answer
                                                                                        </p>
                                                                                        <p className="font-mono text-sm text-slate-700">
                                                                                                {testCase.output}
                                                                                        </p>
                                                                                </div>
                                                                                {(visibleRunOutputMap[testCase.index] || isRunningVisible) && (
                                                                                        <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                        Output Returned
                                                                                                </p>
                                                                                                <p className="font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                                                        {visibleRunOutputMap[testCase.index]?.actual || (isRunningVisible ? "Running..." : "No output")}
                                                                                                </p>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                )}
                                                        </div>
                                                );
                                        })}
                                </div>
                        </div>

                        <div className="mt-8">
                                <h3 className="mb-2 text-base font-semibold text-slate-800">
                                        Custom Input
                                </h3>
                                <textarea
                                        value={customInput}
                                        onChange={(event) => setCustomInput(event.target.value)}
                                        placeholder="Enter custom input..."
                                        className="h-28 w-full resize-none rounded-md border border-slate-300 p-3 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="mt-3">
                                        <button
                                                type="button"
                                                onClick={handleRunCustomInput}
                                                disabled={isRunningCustom}
                                                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                                {isRunningCustom ? "Running..." : "Run Custom Input"}
                                        </button>
                                </div>
                                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 leading-relaxed">
                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                Output Returned
                                        </p>
                                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">
                                                {customOutputResultValue || (isRunningCustom ? "Execution in progress..." : "No output returned.")}
                                        </pre>
                                </div>
                        </div>
                </>
        );

        const renderResultTab = () => {
                if (!selectedSubmission) {
                        return (
                                <p className="text-sm font-medium text-slate-700">
                                        {resultPrompt || "Submit code first to view results."}
                                </p>
                        );
                }

                const score = submissionScore;

                return (
                        <>
                                <h2 className="mb-2 text-lg font-semibold text-slate-800">
                                        Submission Summary
                                </h2>
                                <div className="mb-4 flex items-center gap-3">
                                        <p className="text-slate-700">
                                                Status: <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass(selectedSubmission.status)}`}>{selectedSubmission.status}</span>
                                        </p>
                                        {selectedSubmission.type === "SUBMISSION" && (
                                                <p className="text-slate-700">
                                                        Score: <span className="font-semibold">{score}%</span>
                                                </p>
                                        )}
                                </div>

                                <h3 className="mb-3 text-base font-semibold text-slate-800">
                                        Submitted Code
                                </h3>
                                <div className="mb-8 h-56 overflow-hidden rounded-md border border-slate-300">
                                        <Editor
                                                height="100%"
                                                defaultLanguage={selectedSubmission.language === "cpp" ? "cpp" : "c"}
                                                language={selectedSubmission.language === "cpp" ? "cpp" : "c"}
                                                value={selectedSubmission.code}
                                                theme={isDarkMode ? "vs-dark" : "vs"}
                                                options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        automaticLayout: true,
                                                }}
                                        />
                                </div>

                                {selectedSubmission.status !== "PENDING" && selectedSubmission.status !== "PROCESSING" && (
                                        <>
                                                <h3 className="mb-3 text-base font-semibold text-slate-800">
                                                        Visible Test Cases
                                                </h3>
                                                <div className="mb-8 space-y-3">
                                                        {visibleResults.map((result, index) => {
                                                                const isExpanded = !!expandedResultCases[index];
                                                                return (
                                                                        <div
                                                                                key={`${question.id}-result-visible-${index}`}
                                                                                className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                                                        >
                                                                                <button
                                                                                        type="button"
                                                                                        onClick={() => toggleResultCase(index)}
                                                                                        className="flex w-full items-center justify-between text-left"
                                                                                >
                                                                                        <p className="font-semibold text-slate-800">
                                                                                                Test case {index + 1}
                                                                                        </p>
                                                                                        <span
                                                                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass(
                                                                                                        result.status,
                                                                                                )}`}
                                                                                        >
                                                                                                {result.status}
                                                                                        </span>
                                                                                </button>
                                                                                {isExpanded && (
                                                                                        <div className="mt-3 space-y-2">
                                                                                                <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Expected</p>
                                                                                                        <pre className="font-mono text-sm text-slate-700">{result.expected}</pre>
                                                                                                </div>
                                                                                                <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Actual</p>
                                                                                                        <pre className="font-mono text-sm text-slate-700">{result.actual}</pre>
                                                                                                </div>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                );
                                                        })}
                                                </div>

                                                <h3 className="mb-3 text-base font-semibold text-slate-800">Hidden Test Cases</h3>
                                                {visibleResults.some((r) => r.status === "FAILED") && (
                                                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                                                Hidden test cases are inaccessible when your code fails to produce valid output on visible
                                                                test cases.
                                                        </div>
                                                )}
                                                <div className="space-y-3">
                                                        {hiddenResults.map((result, index) => (
                                                                <div
                                                                        key={`${question.id}-result-hidden-${index}`}
                                                                        className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                                                >
                                                                        <div className="flex items-center justify-between">
                                                                                <p className="font-semibold text-slate-800">Hidden test case {index + 1}</p>
                                                                                <span
                                                                                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass(
                                                                                                result.status,
                                                                                        )}`}
                                                                                >
                                                                                        {result.status}
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        </>
                                )}

                                <h3 className="mb-3 mt-8 text-base font-semibold text-slate-800">
                                        All Submissions
                                </h3>
                                <div className="space-y-2">
                                        {actualSubmissions.map((item) => {
                                                const isSelected =
                                                        selectedSubmission?.id === item.id;

                                                return (
                                                        <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() =>
                                                                        setSelectedSubmissionId(
                                                                                item.id,
                                                                        )
                                                                }
                                                                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${isSelected
                                                                        ? "border-blue-500 bg-blue-50"
                                                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                                                        }`}
                                                        >
                                                                <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-slate-700">
                                                                                {new Date(
                                                                                        item.submittedAt || item.createdAt
                                                                                ).toLocaleString()}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">{item.type}</span>
                                                                </div>
                                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass(item.status)}`}>
                                                                        {item.status}
                                                                </span>
                                                        </button>
                                                );
                                        })}
                                </div>
                        </>
                );
        };
        return (
                <div className="relative h-dvh overflow-hidden bg-slate-100">
                        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
                                <div className="flex items-center gap-2">
                                        <button
                                                type="button"
                                                onClick={onHome}
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                                Home
                                        </button>
                                        <button
                                                type="button"
                                                onClick={onPreviousQuestion}
                                                disabled={questionIndex <= 0}
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                                Previous
                                        </button>
                                        <button
                                                type="button"
                                                onClick={onNextQuestion}
                                                disabled={
                                                        questionIndex >= totalQuestions - 1
                                                }
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                                Next
                                        </button>
                                </div>

                                <div className="flex items-center gap-2">
                                        <button
                                                type="button"
                                                onClick={onLogout}
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                                Logout
                                        </button>
                                        <button
                                                type="button"
                                                onClick={onToggleDarkMode}
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                                {isDarkMode
                                                        ? "Editor: Dark"
                                                        : "Editor: Light"}
                                        </button>
                                        <button
                                                type="button"
                                                onClick={() =>
                                                        setIsProfileOpen((previous) => !previous)
                                                }
                                                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                                Profile
                                        </button>
                                </div>
                        </div>

                        <div
                                ref={containerRef}
                                className="mx-auto flex h-[calc(100%-3.5rem)] min-h-0 w-full flex-col gap-2 p-3 md:flex-row md:p-4"
                        >
                                <div
                                        className="h-full min-h-0 w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:w-auto"
                                        style={{ flexBasis: `${leftPanelWidth}%` }}
                                >
                                        <div className="mb-5 flex items-center gap-2">
                                                <button
                                                        type="button"
                                                        onClick={handleSelectDescription}
                                                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "description"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                                                                }`}
                                                >
                                                        Description
                                                </button>
                                                <button
                                                        type="button"
                                                        onClick={handleSelectResult}
                                                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "result"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                                                                }`}
                                                >
                                                        Result
                                                </button>
                                        </div>

                                        <h1 className="mb-4 text-2xl font-bold text-slate-800">
                                                {question.title}
                                        </h1>

                                        {statusText && (
                                                <p className="mb-4 text-sm text-slate-600">
                                                        {statusText}
                                                </p>
                                        )}

                                        {activeTab === "description"
                                                ? renderDescriptionTab()
                                                : renderResultTab()}
                                </div>

                                <div
                                        onMouseDown={() => setIsResizing(true)}
                                        className="hidden w-2 cursor-col-resize rounded bg-slate-300/70 hover:bg-slate-400 md:block"
                                        role="separator"
                                        aria-label="Resize panels"
                                />

                                <div
                                        className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:w-auto"
                                        style={{ flexBasis: `${100 - leftPanelWidth}%` }}
                                >
                                        <div className="mb-3 flex flex-none items-center justify-between gap-3">
                                                <h2 className="text-lg font-semibold text-slate-700">
                                                        Code Editor
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                                type="button"
                                                                onClick={handleSave}
                                                                disabled={isSaving}
                                                                className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                                        >
                                                                {isSaving ? "Saving..." : "Save Code"}
                                                        </button>
                                                        <button
                                                                type="button"
                                                                onClick={handleReset}
                                                                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                                                        >
                                                                Reset Code
                                                        </button>
                                                        <button
                                                                type="button"
                                                                onClick={handleSubmit}
                                                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                        >
                                                                Submit
                                                        </button>
                                                </div>
                                        </div>

                                        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-300">
                                                <Editor
                                                        height="100%"
                                                        defaultLanguage="cpp"
                                                        language="cpp"
                                                        value={code}
                                                        onChange={(value) => onCodeChange(value || "")}
                                                        theme={isDarkMode ? "vs-dark" : "vs"}
                                                        options={{
                                                                minimap: { enabled: false },
                                                                fontSize: 14,
                                                                automaticLayout: true,
                                                        }}
                                                />
                                        </div>
                                </div>
                        </div>

                        {isProfileOpen && (
                                <div className="absolute inset-0 z-20 flex items-start justify-end bg-black/30 p-4">
                                        <div
                                                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-slate-800 shadow-xl"
                                        >
                                                <div className="mb-4 flex items-center justify-between">
                                                        <h3 className="text-lg font-semibold">
                                                                Profile
                                                        </h3>
                                                        <button
                                                                type="button"
                                                                onClick={() =>
                                                                        setIsProfileOpen(false)
                                                                }
                                                                className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-slate-200/40"
                                                        >
                                                                Close
                                                        </button>
                                                </div>
                                                <p className="mb-2 text-sm">
                                                        <span className="font-semibold">Name:</span>{" "}
                                                        {userProfile.name}
                                                </p>
                                                <p className="text-sm">
                                                        <span className="font-semibold">Email:</span>{" "}
                                                        {userProfile.email}
                                                </p>
                                        </div>
                                </div>
                        )}

                </div>
        );
}

QuestionPage.propTypes = {
        question: PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                title: PropTypes.string.isRequired,
                description: PropTypes.string.isRequired,
                visibleTestCasesJson: PropTypes.string,
                testCases: PropTypes.arrayOf(
                        PropTypes.shape({
                                id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                                input: PropTypes.string.isRequired,
                                output: PropTypes.string.isRequired,
                                visible: PropTypes.bool.isRequired,
                        }),
                ),
        }).isRequired,
        questionIndex: PropTypes.number.isRequired,
        totalQuestions: PropTypes.number.isRequired,
        code: PropTypes.string.isRequired,
        onCodeChange: PropTypes.func.isRequired,
        onSaveCode: PropTypes.func.isRequired,
        onResetCode: PropTypes.func.isRequired,
        onSubmitCode: PropTypes.func.isRequired,
        submissions: PropTypes.arrayOf(
                PropTypes.shape({
                        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                        questionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                        code: PropTypes.string.isRequired,
                        created_at: PropTypes.string,
                        submittedAt: PropTypes.string,
                        status: PropTypes.string.isRequired,
                        testResults: PropTypes.arrayOf(
                                PropTypes.shape({
                                        visible: PropTypes.bool.isRequired,
                                        status: PropTypes.string,
                                }),
                        ),
                }),
        ).isRequired,
        onHome: PropTypes.func.isRequired,
        onPreviousQuestion: PropTypes.func.isRequired,
        onNextQuestion: PropTypes.func.isRequired,
        onLogout: PropTypes.func.isRequired,
        onToggleDarkMode: PropTypes.func.isRequired,
        isDarkMode: PropTypes.bool.isRequired,
        userProfile: PropTypes.shape({
                name: PropTypes.string.isRequired,
                email: PropTypes.string.isRequired,
        }).isRequired,
};

export default QuestionPage;
