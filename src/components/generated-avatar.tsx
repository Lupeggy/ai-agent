import { createAvatar } from "@dicebear/core";
import * as botttsNeutral from "@dicebear/bottts-neutral";
import * as initialStyle from "@dicebear/initials";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
    seed: string;
    className?: string;
    variant?: "botttsNeutral" | "initials";
}

export const GeneratedAvatar = ({
        seed, 
        className, 
        variant = "botttsNeutral"
    }: GeneratedAvatarProps) => {
    // Create avatar using the requested style (only 'seed' is a guaranteed option across styles)
    const avatar = createAvatar(
        variant === "initials" ? initialStyle : botttsNeutral,
        { seed }
    );

    // Generate avatar URI
    const avatarUri = avatar.toDataUri();
    const fallback = seed.charAt(0).toUpperCase();

        return (
            <Avatar className={cn("h-10 w-10", className)}>
            <AvatarImage 
                src={avatarUri} 
                alt={`${fallback}'s avatar`} 
                onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                }} 
            />
            <AvatarFallback className="bg-muted">
                {fallback}
            </AvatarFallback>
            </Avatar>
    );
    };
