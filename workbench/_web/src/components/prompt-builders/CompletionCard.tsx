import { ALargeSmall, Grid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import type { TokenPredictions } from "@/types/tokenizer";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { PredictionDisplay } from "@/components/prompt-builders/PredictionDisplay";
import { Input } from "@/components/ui/input";
import { tokenizeText } from "@/actions/tokenize";
import type { Token } from "@/types/tokenizer";
import { TooltipButton } from "../ui/tooltip-button";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { getExecuteSelected } from "@/lib/api/modelsApi";
import { toast } from "sonner";
import { useDeleteChartConfig, useUpdateChartConfig } from "@/lib/api/configApi";
import { LensChartConfig, NewChart } from "@/db/schema";
import { LensConfig } from "@/types/lens";
import { useWorkspace } from "@/stores/useWorkspace";
import { useCreateChart, useLensGrid } from "@/lib/api/chartApi";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChartData } from "@/lib/queries/chartQueries";
import { getChartConfigs } from "@/lib/queries/configQueries";



export function CompletionCard({ chartConfig }: { chartConfig: LensChartConfig }) {

    const initialCompletion = chartConfig.data;

    const { activeTab, setActiveTab } = useWorkspace();

    // Prediction state
    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(
        initialCompletion.tokens.length > 0
    );
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Tokenization state
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const [lastTokenizedText, setLastTokenizedText] = useState<string | null>(null);
    const [isRevising, setIsRevising] = useState<boolean>(false);
    const { tokenizeOnEnter } = useLensWorkspace();

    // Completion state
    const [completion, setCompletion] = useState<LensConfig>(initialCompletion);

    const updateChartConfigMutation = useUpdateChartConfig();
    const deleteChartConfigMutation = useDeleteChartConfig();

    const textHasChanged = completion.prompt !== lastTokenizedText;
    const shouldEnableTokenize = completion.prompt && (!tokenData || textHasChanged);


    // async function createLineChart() {
    //     if (!chartConfig?.chartId) {
    //         console.error("No chart available");
    //         return;
    //     }
    //     try {
    //         const data = await lensLineMutation.mutateAsync({
    //             completions: completions,
    //             chartId: chartConfig.chartId
    //         });

    //         return data;
    //     } catch (error) {
    //         console.error("Error creating line chart:", error);
    //         throw error;
    //     }
    // }

    const createChartMutation = useCreateChart();
    const lensGridMutation = useLensGrid();
    const { workspaceId } = useParams();

    const { data: activeChartConfigs, refetch: refetchActiveChartConfigs } = useQuery({
        queryKey: ["activeChartConfigs"],
        queryFn: () => getChartConfigs(activeTab as string),
        enabled: !!activeTab,
    });

    async function createHeatmap(chartId: string) {
        try {
            // Ensure we have the latest chart configs
            const { data: latestChartConfigs } = await refetchActiveChartConfigs();
            const configs = latestChartConfigs?.map(config => config.data as LensConfig) || [];
            
            const data = await lensGridMutation.mutateAsync({
                completions: [...configs, completion],
                chartId: chartId
            });

            return data;
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        }
    }

    async function handleCreateChart(chartType: "line" | "heatmap") {

        let chartId = activeTab;

        // Create a new chart if in a new tab
        if (!chartId) {
            const newChart: NewChart = {
                workspaceId: workspaceId as string,
            };
            const createdChart = await createChartMutation.mutateAsync({ configId: chartConfig.id, chart: newChart });
            setActiveTab(createdChart.id as string);
            chartId = createdChart.id as string;
        }

        if (chartType === "heatmap") {
            await createHeatmap(chartId);
        } else {
            console.error("Not implemented");
        }
    }


    const handleDeleteCompletion = async () => {
        await deleteChartConfigMutation.mutateAsync({
            configId: chartConfig.id,
        });
    }

    useEffect(() => {
        if (showPredictions && !tokenData) {
            handleTokenize();
        }
        if (showPredictions && !predictions && completion.tokens.length > 0) {
            runPredictions();
        }
    }, []);

    const removeToken = (idxs: number[]) => {
        setCompletion({
            ...completion,
            tokens: completion.tokens.filter((t) => !idxs.includes(t.idx)),
        });
    };

    const tokenSelection = useTokenSelection({ compl: completion, removeToken });

    const handleTokenize = async () => {
        if (!completion.prompt) {
            setTokenData(null);
            setLastTokenizedText(null);
            return;
        }

        try {
            const tokens = await tokenizeText(completion.prompt, completion.model);
            setTokenData(tokens);
            setLastTokenizedText(completion.prompt);

            // Auto select and run for last token if first time tokenizing
            if (tokens && !showPredictions) {
                const lastTokenIdx = tokens.length - 1;
                setSelectedIdx(lastTokenIdx);
                tokenSelection.setHighlightedTokens([lastTokenIdx]);
                await runPredictions(lastTokenIdx);
            }

        } catch (err) {
            toast.error("Error tokenizing text");
        }
    };

    const updateCompletionTokens = (lastTokenIndex?: number) => {
        const existingIndices = new Set(completion.tokens.map((t) => t.idx));

        // Create new tokens only for indices that don't already exist
        const newTokens = tokenSelection.highlightedTokens
            .filter((idx) => !existingIndices.has(idx))
            .map((idx) => ({
                idx,
            }));

        const updatedCompletion = {
            ...completion,
            tokens: [...completion.tokens, ...newTokens],
        }

        if (lastTokenIndex) {
            updatedCompletion.tokens = [...updatedCompletion.tokens, { idx: lastTokenIndex }];
        }

        return updatedCompletion;
    }

    const runPredictions = async (lastTokenIndex?: number) => {
        setLoadingPredictions(true);

        const updatedCompletion = updateCompletionTokens(lastTokenIndex);

        try {
            const data = await getExecuteSelected({
                prompt: updatedCompletion.prompt,
                model: updatedCompletion.model,
                tokens: updatedCompletion.tokens,
            });

            setPredictions(data);
            setShowPredictions(true);
            setCompletion(updatedCompletion);

            await updateChartConfigMutation.mutateAsync({
                configId: chartConfig.id,
                config: {
                    workspaceId: chartConfig.workspaceId,
                    data: updatedCompletion,
                    type: "lens",
                }
            });
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            setLoadingPredictions(false);
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCompletion({
            ...completion,
            prompt: e.target.value,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (tokenizeOnEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (shouldEnableTokenize) {
                handleTokenize();
            }
        }
    };

    const handleClear = async () => {
        setShowPredictions(false);
        setIsRevising(false);
        setPredictions(null);
        tokenSelection.setHighlightedTokens([]);
        setSelectedIdx(null);

        const updatedCompletion = {
            ...completion,
            tokens: [],
        }

        await updateChartConfigMutation.mutateAsync({
            configId: chartConfig.id,
            config: {
                workspaceId: chartConfig.workspaceId,
                data: updatedCompletion,
                type: "lens",
            }
        });
    }

    return (
        <div className={cn("group relative", deleteChartConfigMutation.isPending && "opacity-50 pointer-events-none")}>
            {/* Delete button */}
            <Button
                variant="ghost"
                title="Delete completion"
                size="icon"
                onClick={handleDeleteCompletion}
                disabled={deleteChartConfigMutation.isPending}
                className="group-hover:opacity-100 opacity-0 h-6 w-6 transition-opacity duration-200 absolute -top-2 -right-2 rounded-full bg-background border shadow-sm"
            >
                <X
                    size={14}
                    className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            </Button>

            <div
                className={cn(
                    "border bg-card px-4 pb-4 overflow-visible transition-all duration-200 ease-in-out w-full min-w-0 max-w-full",
                    showPredictions ? "rounded-t-lg" : "rounded-lg",
                )}
            >
                {/* Header */}
                <div className="flex items-center my-4 justify-between">
                    <div className="flex px-0.5 flex-col">
                        <Input
                            value={completion.name}
                            placeholder="Untitled"
                            onChange={(e) => setCompletion({
                                ...completion,
                                name: e.target.value,
                            })}
                            className="border-none shadow-none rounded h-fit px-0 py-0 font-bold"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs">{completion.model}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <TooltipButton
                            variant="outline"
                            size="icon"
                            id="tokenize-button"
                            onClick={handleTokenize}
                            disabled={!shouldEnableTokenize}
                            tooltip={textHasChanged ? "Re-tokenize" : "Tokenize"}
                        >
                            <ALargeSmall size={16} className="w-8 h-8" />
                        </TooltipButton>

                        <TooltipButton
                            variant="outline"
                            size="icon"
                            id="tokenize-button"
                            onClick={() => handleCreateChart("heatmap")}
                            disabled={lensGridMutation.isPending}
                            tooltip={"Create heatmap"}
                        >
                            <Grid size={16} className="w-8 h-8" />
                        </TooltipButton>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full gap-4">
                    {!showPredictions ? (
                        <Textarea
                            value={completion.prompt}
                            onChange={handlePromptChange}
                            onKeyDown={handleKeyDown}
                            className="h-24"
                            placeholder="Enter your prompt here."
                            id="completion-text"
                        />
                    ) : (
                        <div
                            className={cn(
                                "flex flex-col w-full px-3 py-2 animate-in slide-in-from-bottom-2 border rounded h-24 overflow-y-auto",
                                loadingPredictions && "pointer-events-none"
                            )}
                            id="token-area"
                        >
                            <TokenArea
                                compl={completion}
                                showPredictions={!isRevising}
                                setSelectedIdx={setSelectedIdx}
                                tokenData={tokenData}
                                tokenSelection={tokenSelection}
                            />
                        </div>
                    )}
                </div>
            </div>
            {showPredictions && (
                <div className="border-x border-b p-4 bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2">
                    <PredictionDisplay
                        predictions={predictions || {}}
                        compl={completion}
                        selectedIdx={selectedIdx}
                        onRevise={() => setIsRevising(true)}
                        setCompletion={setCompletion}
                        onClear={handleClear}
                        onRunPredictions={runPredictions}
                        loadingPredictions={loadingPredictions}
                        highlightedTokensCount={tokenSelection.highlightedTokens.length}
                        setIsRevising={setIsRevising}
                    />
                </div>
            )}
        </div>
    );
}