import PropTypes from "prop-types";

function HomePage({ questions, onSelectQuestion, onLogout }) {
        return (
                <div className="min-h-screen bg-slate-100 p-6 md:p-10">
                        <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow-lg md:p-8">
                                <div className="mb-6 flex items-center justify-between gap-4">
                                        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                                                CSL2020 Lab Questions
                                        </h1>
                                        <button
                                                type="button"
                                                onClick={onLogout}
                                                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                                        >
                                                Log out
                                        </button>
                                </div>

                                <div className="space-y-3">
                                        {questions.map((question, index) => (
                                                <button
                                                        key={question.id}
                                                        type="button"
                                                        onClick={() => onSelectQuestion(question.id)}
                                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left hover:border-blue-400 hover:bg-blue-50"
                                                >
                                                        <p className="text-sm font-semibold text-blue-700">
                                                                Question {index + 1}
                                                        </p>
                                                        <p className="mt-1 text-base font-medium text-slate-800">
                                                                {question.title}
                                                        </p>
                                                </button>
                                        ))}
                                </div>
                        </div>
                </div>
        );
}

HomePage.propTypes = {
        questions: PropTypes.arrayOf(
                PropTypes.shape({
                        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                        title: PropTypes.string.isRequired,
                        description: PropTypes.string.isRequired,
                }),
        ).isRequired,
        onSelectQuestion: PropTypes.func.isRequired,
        onLogout: PropTypes.func.isRequired,
};

export default HomePage;
