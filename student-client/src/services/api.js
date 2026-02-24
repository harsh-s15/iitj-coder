const API_BASE_URL = "http://localhost:8080";

export const login = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Login failed");
    }
    return response.json();
};

export const logout = async () => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
    });
    return response;
};

export const fetchProfile = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Not authenticated");
    }
    return response.json();
};

export const fetchQuestions = async () => {
    const response = await fetch(`${API_BASE_URL}/api/questions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch questions");
    }
    return response.json();
};

export const fetchQuestion = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch question");
    }
    return response.json();
};

export const submitCode = async (questionId, code, language, type = "SUBMISSION", customInput = "") => {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, code, language, type, customInput }),
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Submission failed");
    }
    return response.json();
};

export const fetchSubmissions = async () => {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch submissions");
    }
    return response.json();
};
