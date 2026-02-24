import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import PropTypes from "prop-types";

const MarkdownRenderer = ({ content }) => {
    return (
        <div className="markdown-content prose prose-slate max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vs}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        ) : (
                            <code
                                className={className}
                                {...props}
                                style={{
                                    backgroundColor: "#fffacd",
                                    padding: "2px 4px",
                                    borderRadius: "4px",
                                    color: "#333",
                                }}
                            >
                                {children}
                            </code>
                        );
                    },
                    // Customizing other elements if needed
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    th({ children }) {
                        return <th className="px-4 py-2 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b">{children}</th>;
                    },
                    td({ children }) {
                        return <td className="px-4 py-2 text-sm text-slate-600 border-b">{children}</td>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

MarkdownRenderer.propTypes = {
    content: PropTypes.string.isRequired,
};

export default MarkdownRenderer;
