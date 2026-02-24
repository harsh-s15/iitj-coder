import PropTypes from "prop-types";
import { useState } from "react";

function LoginForm({ onLogin }) {
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");

        const handleSubmit = (event) => {
                event.preventDefault();

                if (email === "" || password === "") {
                        setError("Por favor, preencha todos os campos.");
                        return;
                }

                setError("");
                if (onLogin) {
                        onLogin({ email, password });
                }
        };

        return (
                <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
                        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                                        Welcome to CSL2020 Lab3!
                                </h2>
                                <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                                <input
                                                        type="email"
                                                        placeholder="studentid@iitj.ac.in"
                                                        value={email}
                                                        onChange={(event) => setEmail(event.target.value)}
                                                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                        </div>

                                        <div className="mb-6">
                                                <input
                                                        type="password"
                                                        placeholder="password"
                                                        value={password}
                                                        onChange={(event) => setPassword(event.target.value)}
                                                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                        </div>

                                        {error && (
                                                <div className="mb-4 text-center text-red-500">
                                                        <p>{error}</p>
                                                </div>
                                        )}

                                        <button
                                                type="submit"
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                                        >
                                                Enter
                                        </button>

                                        <p className="text-center text-sm text-gray-600 mt-4">
                                                <a href="#" className="text-blue-500 hover:underline">
                                                        Create an account
                                                </a>
                                        </p>
                                </form>
                        </div>
                </div>
        );
}

LoginForm.propTypes = {
        onLogin: PropTypes.func,
};

export default LoginForm;
