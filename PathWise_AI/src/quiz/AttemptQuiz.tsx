import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

type QuizQuestion = {
	question_id: string;
	question: string;
	options: string[];
	correct_answer: string;
	explanation?: string;
	topic?: string;
	subtopic?: string;
	difficulty_level?: string;
};

type QuizData = {
	quiz_id: string;
	topic?: string;
	difficulty_level?: string;
	questions?: QuizQuestion[];
	review_results?: QuizQuestion[];
};

export default function AttemptQuiz() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

	const quizData = (location.state as { quizData?: QuizData } | null)?.quizData;
	const questions = useMemo(() => quizData?.questions || quizData?.review_results || [], [quizData]);

	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const questionRefs = useRef<Record<string, HTMLElement | null>>({});

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/");
			return;
		}

		if (!quizData || !quizData.quiz_id || questions.length === 0) {
			navigate("/quiz");
		}
	}, [isAuthenticated, navigate, quizData, questions.length]);

	const scrollToQuestion = (questionId: string) => {
		questionRefs.current[questionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!quizData?.quiz_id) return;

		const attemptedAnswers = questions
			.filter((question) => answers[question.question_id])
			.map((question) => ({
				question_id: question.question_id,
				answer_submitted: answers[question.question_id],
			}));

		setLoading(true);
		setError(null);

		try {
			const response = await apiClient(
				"/quiz/submit",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						quiz_id: quizData.quiz_id,
						answers: attemptedAnswers,
						attempted_at: new Date().toISOString(),
					}),
				},
				dispatch
			);

			const data = await response.json();
			if (!response.ok) {
				setError(data.message || data.detail || "Failed to submit quiz");
				return;
			}

			navigate(`/quiz/${quizData.quiz_id}`, {
				state: {
					quizData,
					evaluationData: data.data?.evaluation || data.data || data,
					analysisData: data.data?.analysis,
				},
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit quiz");
		} finally {
			setLoading(false);
		}
	};

	if (!quizData || questions.length === 0) {
		return null;
	}

	return (
		<div className="flex-1 min-h-screen bg-gray-50 font-custom2 relative overflow-y-auto">
			<header className="sticky top-0 z-20 bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate("/quiz")}
						className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
					>
						<ArrowLeft className="w-4 h-4" />
					</button>
					<div className="flex flex-col gap-0.5">
						<h1 className="text-base font-bold font-ar-one-sans text-gray-900">Attempt Quiz</h1>
						<p className="text-xs text-gray-400">{quizData.topic || "Dynamic quiz session"}</p>
					</div>
				</div>

				<button
					type="submit"
					form="attempt-quiz-form"
					disabled={loading}
					className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl flex items-center gap-2"
				>
					{loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
					<span>{loading ? "Submitting..." : "Submit Quiz"}</span>
				</button>
			</header>

			{error && (
				<div className="mx-6 mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
					<AlertCircle className="w-4 h-4 text-rose-500" />
					<span className="font-mono">{error}</span>
				</div>
			)}

			<div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
				<main className="xl:col-span-10 xl:order-1 flex flex-col gap-4 pb-20">
					<form id="attempt-quiz-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
						{questions.map((question, index) => (
							<section
								key={question.question_id}
								ref={(node) => {
									questionRefs.current[question.question_id] = node;
								}}
								className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs"
							>
								<div className="flex items-start justify-between gap-4 mb-4">
									<div className="flex flex-col gap-1">
										<span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-400">Question {index + 1}</span>
										<h3 className="text-sm font-bold text-gray-900 leading-relaxed">{question.question}</h3>
									</div>
									<span className="text-[10px] font-mono uppercase text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
										{question.difficulty_level || quizData.difficulty_level || "quiz"}
									</span>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{question.options.map((option) => {
										const selected = answers[question.question_id] === option;
										return (
											<button
												key={option}
												type="button"
												onClick={() => setAnswers((prev) => ({ ...prev, [question.question_id]: option }))}
												className={`text-left px-4 py-3 rounded-xl border transition ${selected ? "bg-blue-50 border-blue-400 text-blue-800" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}
											>
												<div className="flex items-start gap-3">
													<span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${selected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
														{option.charAt(0)}
													</span>
													<span className="text-sm leading-relaxed">{option}</span>
												</div>
											</button>
										);
									})}
								</div>
							</section>
						))}
					</form>
				</main>

				<aside className="xl:col-span-2 xl:order-2 xl:sticky xl:top-24 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
					<div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
						<Sparkles className="w-4 h-4 text-blue-500" />
						<h2 className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wider">Question Navigator</h2>
					</div>
					<div className="grid grid-cols-5 xl:grid-cols-2 gap-2">
						{questions.map((question, index) => (
							<button
								key={question.question_id}
								type="button"
								onClick={() => scrollToQuestion(question.question_id)}
								className={`h-10 rounded-xl border text-xs font-bold transition ${answers[question.question_id] ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300"}`}
							>
								{index + 1}
							</button>
						))}
					</div>
				</aside>

			</div>
		</div>
	);
}
