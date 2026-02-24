import PropTypes from "prop-types";
import { useState } from "react";
import { Lock, User } from "lucide-react";

function AdminLoginForm({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!username || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setError("");
        setIsLoading(true);
        try {
            await onLogin({ username, password });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-900 font-sans">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-2">
                    Admin Portal
                </h2>
                <p className="text-center text-slate-500 mb-8 font-medium">
                    IITJ Coder Management
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Signing in..." : "Sign In to Dashboard"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 italic text-center text-xs text-slate-400">
                    Secure Administrative Access Only
                </div>
            </div>
        </div>
    );
}

AdminLoginForm.propTypes = {
    onLogin: PropTypes.func.isRequired,
};

export default AdminLoginForm;
