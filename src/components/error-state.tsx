import { AlertTriangle } from "lucide-react";

interface Props {
    title: string;
    description: string;
    // onRetry?: () => void; // Uncomment if you want a retry button
}

export const ErrorState = ({ title, description /*, onRetry*/ }: Props) => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-xs border border-red-200">
                <AlertTriangle className="text-red-500 mb-4" size={40} />
                <h2 className="text-xl font-semibold text-red-700 mb-2">{title}</h2>
                <p className="text-gray-500 text-center mb-2">{description}</p>
                {/* Uncomment below for a retry button
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                        Retry
                    </button>
                )} */}
            </div>
        </div>
    );
};