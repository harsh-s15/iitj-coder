import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    LayoutDashboard,
    PlusCircle,
    ShieldCheck,
    LogOut,
    BookOpen,
    Activity,
    Users,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import { fetchQuestions, createQuestion, generateCredentials, fetchSubmissions, fetchSessions } from "../api";
import QuestionForm from "./QuestionForm";

function AdminDashboard({ onLogout, user }) {
    const [activeTab, setActiveTab] = useState("questions");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [studentEmail, setStudentEmail] = useState("");
    const [genResult, setGenResult] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [sessionsStatus, setSessionsStatus] = useState("");

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const qs = await fetchQuestions();
            setQuestions(qs);
            const subs = await fetchSubmissions();
            setSubmissions(subs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuestion = async (data) => {
        try {
            await createQuestion(data);
            setIsCreating(false);
            loadInitialData();
        } catch (err) {
            alert("Error creating question: " + err.message);
        }
    };

    const handleGenerate = async () => {
        try {
            const res = await generateCredentials(studentEmail);
            setGenResult(res);
        } catch (err) {
            alert("Error generating credentials");
        }
    };

    const handleFetchSessions = async () => {
        try {
            const res = await fetchSessions();
            setSessionsStatus(typeof res === 'string' ? res : JSON.stringify(res));
        } catch (err) {
            setSessionsStatus("Error fetching sessions");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p className="animate-pulse">Loading dashboard data...</p>
                </div>
            );
        }

        switch (activeTab) {
            case "questions":
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Problem Set</h2>
                                <p className="text-slate-500">Manage questions and test cases</p>
                            </div>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                <PlusCircle size={20} />
                                New Question
                            </button>
                        </div>

                        {isCreating ? (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800">Create New Problem</h3>
                                    <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
                                </div>
                                <QuestionForm onSubmit={handleCreateQuestion} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {questions.map(q => (
                                    <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group cursor-pointer relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-600' :
                                                q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">ID: {q.id}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">{q.title}</h4>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{q.description}</p>
                                        <div className="flex items-center text-indigo-600 font-bold text-sm">
                                            Edit Details <ChevronRight size={16} />
                                        </div>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rotate-45 translate-x-12 -translate-y-12"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case "submissions":
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800">Activities</h2>
                            <p className="text-slate-500">Real-time submission monitoring</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Submission ID</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Question</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {submissions.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-slate-600">#{s.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{s.user?.username || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{s.question?.title || 'Unknown'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${s.status === 'ACCEPTED' || s.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' :
                                                    s.status === 'QUEUED' || s.status === 'RUNNING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{new Date(s.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "users":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-600" />
                                Credential Generator
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Student Email</label>
                                    <input
                                        type="email"
                                        placeholder="student@iitj.ac.in"
                                        value={studentEmail}
                                        onChange={(e) => setStudentEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg"
                                >
                                    Generate Student User
                                </button>
                                {genResult && (
                                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Result Generated</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="block text-[10px] text-indigo-500 uppercase font-bold">Username</span>
                                                <span className="font-mono text-indigo-800 font-bold">{genResult.username}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-indigo-500 uppercase font-bold">Password</span>
                                                <span className="font-mono text-indigo-800 font-bold">{genResult.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="text-indigo-600" />
                                Session Monitor
                            </h3>
                            <div className="space-y-4">
                                <button
                                    onClick={handleFetchSessions}
                                    className="w-full border-2 border-slate-800 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Check Active Sessions
                                </button>
                                {sessionsStatus && (
                                    <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 whitespace-pre-wrap border border-slate-100">
                                        {sessionsStatus}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
                            I
                        </div>
                        <h1 className="text-xl font-black tracking-tight">Admin<span className="text-indigo-600">Portal</span></h1>
                    </div>

                    <nav className="space-y-1.5">
                        <button
                            onClick={() => setActiveTab("questions")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "questions" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <BookOpen size={20} /> Problems
                        </button>
                        <button
                            onClick={() => setActiveTab("submissions")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "submissions" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <Activity size={20} /> Monitoring
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "users" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <Users size={20} /> Management
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-8 pt-4 border-t border-slate-50">
                    <div className="bg-slate-50 p-4 rounded-xl mb-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated As</div>
                        <div className="text-sm font-black text-slate-800 truncate">{user?.username || 'Administrator'}</div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-12 overflow-y-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Overview</h2>
                        <h1 className="text-4xl font-extrabold text-slate-900 capitalize">{activeTab} Manager</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-64 shadow-sm"
                            />
                        </div>
                        <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all relative">
                            <LayoutDashboard size={20} />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full"></span>
                        </button>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
}

AdminDashboard.propTypes = {
    onLogout: PropTypes.func.isRequired,
    user: PropTypes.object
};

export default AdminDashboard;
