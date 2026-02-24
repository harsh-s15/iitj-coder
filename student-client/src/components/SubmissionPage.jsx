import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

const getBadgeClass = (status) => {
        if (status === "passed") {
                return "bg-emerald-100 text-emerald-700";
        }
        if (status === "failed") {
                return "bg-red-100 text-red-700";
        }
        return "bg-slate-100 text-slate-700";
};

function SubmissionPage({ submission, onBackToQuestion, onBackToQuestions }) {
        const [expandedVisibleCases, setExpandedVisibleCases] = useState({});

        const { visibleResults, hiddenResults } = useMemo(() => {
                const visible = submission.testResults.filter((result) => result.visible);
                const hidden = submission.testResults.filter((result) => !result.visible);
                return { visibleResults: visible, hiddenResults: hidden };
        }, [submission.testResults]);

        const toggleVisibleCase = (index) => {
                setExpandedVisibleCases((previous) => ({
                        ...previous,
                        [index]: !previous[index],
                }));
        };

        return (
                <div className="min-h-screen bg-slate-100 p-4 md:p-8">
                        <div className="mx-auto w-full max-w-7xl rounded-xl bg-white p-6 shadow-lg md:p-8">
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                                <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                                                        Submission Summary
                                                </h1>
                                                <p className="mt-1 text-slate-600">
                                                        {submission.questionTitle}
                                                </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                                <button
                                                        type="button"
                                                        onClick={onBackToQuestion}
                                                        className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                                                >
                                                        Back to Question
                                                </button>
                                                <button
                                                        type="button"
                                                        onClick={onBackToQuestions}
                                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                >
                                                        Back to Questions
                                                </button>
                                        </div>
                                </div>

                                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                                        Submitted Code
                                </h2>
                                <div className="mb-8 h-[45vh] overflow-hidden rounded-lg border border-slate-300">
                                        <Editor
                                                height="100%"
                                                defaultLanguage="cpp"
                                                value={submission.code}
                                                theme="vs-dark"
                                                options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 14,
                                                        automaticLayout: true,
                                                }}
                                        />
                                </div>

                                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                                        Visible Test Cases
                                </h2>
                                <div className="mb-8 space-y-3">
                                        {visibleResults.map((result, index) => {
                                                const isExpanded = !!expandedVisibleCases[index];
                                                return (
                                                        <div
                                                                key={`${submission.questionId}-visible-${index}`}
                                                                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                                                        >
                                                                <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                                toggleVisibleCase(index)
                                                                        }
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
                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                Input
                                                                                        </p>
                                                                                        <p className="font-mono text-sm text-slate-700">
                                                                                                {result.input}
                                                                                        </p>
                                                                                </div>
                                                                                <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                Expected
                                                                                                Answer
                                                                                        </p>
                                                                                        <p className="font-mono text-sm text-slate-700">
                                                                                                {result.expectedOutput}
                                                                                        </p>
                                                                                </div>
                                                                                {result.status !== "idle" && (
                                                                                        <div className="rounded-md border border-slate-200 bg-white p-3">
                                                                                                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                                                                                        Output
                                                                                                        Returned
                                                                                                </p>
                                                                                                <p className="font-mono text-sm text-slate-700">
                                                                                                        {result.outputReturned}
                                                                                                </p>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                )}
                                                        </div>
                                                );
                                        })}
                                </div>

                                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                                        Hidden Test Cases
                                </h2>
                                <div className="space-y-3">
                                        {hiddenResults.map((result, index) => (
                                                <div
                                                        key={`${submission.questionId}-hidden-${index}`}
                                                        className="rounded-md border border-slate-200 bg-slate-50 p-4"
                                                >
                                                        <div className="flex items-center justify-between">
                                                                <p className="font-semibold text-slate-800">
                                                                        Hidden test case {index + 1}
                                                                </p>
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
                        </div>
                </div>
        );
}

SubmissionPage.propTypes = {
        submission: PropTypes.shape({
                questionId: PropTypes.string.isRequired,
                questionTitle: PropTypes.string.isRequired,
                code: PropTypes.string.isRequired,
                submittedAt: PropTypes.string.isRequired,
                testResults: PropTypes.arrayOf(
                        PropTypes.shape({
                                index: PropTypes.number.isRequired,
                                visible: PropTypes.bool.isRequired,
                                input: PropTypes.string.isRequired,
                                expectedOutput: PropTypes.string.isRequired,
                                outputReturned: PropTypes.string.isRequired,
                                status: PropTypes.oneOf([
                                        "idle",
                                        "running",
                                        "passed",
                                        "failed",
                                ]).isRequired,
                        }),
                ).isRequired,
        }).isRequired,
        onBackToQuestion: PropTypes.func.isRequired,
        onBackToQuestions: PropTypes.func.isRequired,
};

export default SubmissionPage;
