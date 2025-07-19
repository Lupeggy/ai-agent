import { Loader2 } from "lucide-react";

interface Props {
    title: string;
    description: string;
}

export const LoadingState = ({ title, description }: Props) => {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-xs">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500 text-center">{description}</p>
            </div>
        </div>
    );
};