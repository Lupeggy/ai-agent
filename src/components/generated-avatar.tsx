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
        let avatar;

        if (variant === "botttsNeutral") {
            avatar = createAvatar(botttsNeutral, {
                seed,
            });
        } else if (variant === "initials") {
            avatar = createAvatar(initialStyle, {
                seed,
                fontWeight: 500,
                fontSize: 50,
            });
        }
        return (
            <Avatar className={cn("h-10 w-10", className)}>
                <AvatarImage src={avatar.toDataUri()} alt="Avatar" />
                <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        )
    };

