import { useState } from "react";
import PropTypes from "prop-types";
import { Save, AlertCircle, Plus, Trash2 } from "lucide-react";

function QuestionForm({ onSubmit, initialData = null }) {
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        difficulty: initialData?.difficulty || "EASY",
        starterCode: initialData?.starterCode || "// Write your code here\n",
        timeLimit: initialData?.timeLimit || 2000,
        memoryLimit: initialData?.memoryLimit || 128
    });

    const [testCases, setTestCases] = useState(() => {
        if (initialData?.testCasesJson) {
            try {
                return JSON.parse(initialData.testCasesJson);
            } catch (e) {
                console.error("Failed to parse initial test cases", e);
            }
        }
        return [];
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addTestCase = (hidden = false) => {
        setTestCases(prev => [...prev, { input: "", output: "", hidden }]);
    };

    const removeTestCase = (index) => {
        setTestCases(prev => prev.filter((_, i) => i !== index));
    };

    const updateTestCase = (index, field, value) => {
        setTestCases(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc));
    };

    const handleFileUpload = async (e, type, index) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        updateTestCase(index, type, text);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const visibleCases = testCases.filter(tc => !tc.hidden);
        const hiddenCases = testCases.filter(tc => tc.hidden);

        onSubmit({
            ...formData,
            visibleTestCasesJson: JSON.stringify(visibleCases),
            hiddenTestCases: hiddenCases
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g., Two Sum"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty</label>
                        <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Time Limit (ms)</label>
                            <input
                                type="number"
                                name="timeLimit"
                                value={formData.timeLimit}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Memory Limit (MB)</label>
                            <input
                                type="number"
                                name="memoryLimit"
                                value={formData.memoryLimit}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">Visible Test Cases (for Students)</label>
                        <button
                            type="button"
                            onClick={() => addTestCase(false)}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            <Plus size={14} /> Add Visible Case
                        </button>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {testCases.filter(tc => !tc.hidden).map((tc, idx) => {
                            const realIndex = testCases.indexOf(tc);
                            return (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeTestCase(realIndex)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Input</label>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => updateTestCase(realIndex, "input", e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Output</label>
                                            <textarea
                                                value={tc.output}
                                                onChange={(e) => updateTestCase(realIndex, "output", e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-6 mb-2">
                        <label className="text-sm font-semibold text-slate-700">Hidden Test Cases (for Evaluation)</label>
                        <button
                            type="button"
                            onClick={() => addTestCase(true)}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            <Plus size={14} /> Add Hidden Case
                        </button>
                    </div>
                    <div className="space-y-4">
                        {testCases.filter(tc => tc.hidden).map((tc, idx) => {
                            const realIndex = testCases.indexOf(tc);
                            return (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeTestCase(realIndex)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Input File</label>
                                            <input
                                                type="file"
                                                accept=".txt"
                                                onChange={(e) => handleFileUpload(e, "input", realIndex)}
                                                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                            {tc.input && <span className="text-[10px] text-emerald-600 font-medium mt-1 block">File loaded ({tc.input.length} chars)</span>}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Output File</label>
                                            <input
                                                type="file"
                                                accept=".txt"
                                                onChange={(e) => handleFileUpload(e, "output", realIndex)}
                                                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                            {tc.output && <span className="text-[10px] text-emerald-600 font-medium mt-1 block">File loaded ({tc.output.length} chars)</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    Description (Markdown) <span className="text-xs font-normal text-slate-400">Include Description, Constraints, and Samples here</span>
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={12}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="# Description&#10;&#10;Explain the problem...&#10;&#10;## Constraints&#10;&#10;- 1 <= N <= 100&#10;&#10;## Samples&#10;&#10;**Input:** 1 2&#10;**Output:** 3"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Starter Code</label>
                <textarea
                    name="starterCode"
                    value={formData.starterCode}
                    onChange={handleChange}
                    rows={8}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-slate-50"
                />
            </div>

            <button
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
                <Save size={20} />
                Save Question
            </button>
        </form>
    );
}

QuestionForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default QuestionForm;
