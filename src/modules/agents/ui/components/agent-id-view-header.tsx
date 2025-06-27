import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Pencil, Trash, Loader2 } from "lucide-react";
import Link from "next/link";

interface AgentIdViewHeaderProps {
    agentId: string;
    agentName: string;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}

export const AgentIdViewHeader = ({ agentId, agentName, onEdit, onDelete, isDeleting }: AgentIdViewHeaderProps) => {
    return (
        <div className="flex flex-col space-y-4 pb-6 border-b border-gray-200">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/agents">Agents</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{agentName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">{agentName}</h1>
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
                            Edit Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 cursor-pointer" disabled={isDeleting}>
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash className="mr-2 h-4 w-4" />
                            )}
                            Delete Agent
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
