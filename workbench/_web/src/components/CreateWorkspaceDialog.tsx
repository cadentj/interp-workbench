"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "@/lib/api/workspaceApi";
import { useRouter } from "next/navigation";

export function CreateWorkspaceDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const router = useRouter();
    const createWorkspaceMutation = useCreateWorkspace();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const newWorkspace = await createWorkspaceMutation.mutateAsync({
                name: name.trim(),
            });
            setOpen(false);
            setName("");
            router.push(`/workbench/${newWorkspace.id}/lens`);
        } catch (error) {
            console.error("Failed to create workspace:", error);
            // You might want to show a toast notification here
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setName("");
        }
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="px-4 py-2">
                    Create Workspace
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                        Create a new workspace to start exploring your model's behavior. You can add Logit Lens and Activation Patching collections after creation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter workspace name..."
                            required
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={createWorkspaceMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={!name.trim() || createWorkspaceMutation.isPending}
                    >
                        {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 