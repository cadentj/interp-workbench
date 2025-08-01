"use client";

import { Plus, Settings2 } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { TooltipButton } from "@/components/ui/tooltip-button";

import * as React from "react";

import { CompletionCard } from "./CompletionCard";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLensConfigs } from "@/lib/queries/chartQueries";
import { useCreateChartConfig } from "@/lib/api/configApi";
import { NewChartConfig, LensConfig } from "@/db/schema";


export function DropdownMenuCheckboxes() {
    const { tokenizeOnEnter, graphOnTokenize, setTokenizeOnEnter, setGraphOnTokenize } = useLensWorkspace();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Settings2 size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Completion Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={tokenizeOnEnter}
                    onCheckedChange={setTokenizeOnEnter}
                >
                    Tokenize on Enter
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={graphOnTokenize}
                    onCheckedChange={setGraphOnTokenize}
                >
                    Graph on Tokenize
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Generate a unique name in the format "Untitled n"
const generateCompletionCardName = (existingCompletions: LensConfig[]): string => {
    const existingNames = existingCompletions.map(completion => completion.data.name);
    let counter = 1;
    let name = `Untitled ${counter}`;
    
    while (existingNames.includes(name)) {
        counter++;
        name = `Untitled ${counter}`;
    }
    
    return name;
};  

export function PromptBuilder() {
    const { workspaceId } = useParams();
    const { modelName } = useSelectedModel();

    const createChartConfigMutation = useCreateChartConfig();

    const { data: chartConfigs } = useQuery({
        queryKey: ["lensChartConfig", workspaceId],
        queryFn: () => getLensConfigs(workspaceId as string),
    });

    async function createCompletion() {
        if (!modelName) {
            console.error("Missing model name");
            return;
        }
        
        try {
            const chartConfig: NewChartConfig = {
                type: "lens",
                workspaceId: workspaceId as string,
                data: {
                    prompt: "",
                    name: generateCompletionCardName(chartConfigs || []),
                    model: modelName,
                    tokens: [],
                },
            };
            await createChartConfigMutation.mutateAsync({
                chartConfig: chartConfig,
            });
        } catch (error) {
            console.error("Failed to create completion:", error);
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />

                        <TooltipButton
                            size="icon"
                            onClick={() => createCompletion()}
                            id="new-section"
                            tooltip="Create a new section"
                        >
                            {createChartConfigMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full" />
                            ) : (
                                <Plus size={16} />
                            )}
                        </TooltipButton>

                        <DropdownMenuCheckboxes />
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4">
                {chartConfigs?.map((chartConfig) => (
                    <CompletionCard initialConfig={chartConfig} key={chartConfig.id} />
                ))}
            </div>
        </div>
    );
}