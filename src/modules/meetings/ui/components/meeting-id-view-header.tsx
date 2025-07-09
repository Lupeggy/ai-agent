import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash, Loader2 } from "lucide-react";
import Link from "next/link";

interface MeetingIdViewHeaderProps {
    meetingId: string;
    meetingName: string;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}

export const MeetingIdViewHeader = ({ 
    meetingId, 
    meetingName, 
    onEdit, 
    onDelete, 
    isDeleting 
}: MeetingIdViewHeaderProps) => {
    return (
        <div className="flex flex-col space-y-4 pb-6 border-b border-gray-200">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/meetings">Meetings</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{meetingName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">{meetingName}</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isDeleting}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onEdit} className="cursor-pointer" disabled={isDeleting}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Meeting
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 cursor-pointer" disabled={isDeleting}>
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash className="mr-2 h-4 w-4" />
                            )}
                            Delete Meeting
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
