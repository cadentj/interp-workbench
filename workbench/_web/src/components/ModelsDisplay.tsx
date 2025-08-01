"use client";

import { useModels } from "@/hooks/useModels";

export function ModelsDisplay() {
    const { models, baseModels, chatModels, isLoading, error } = useModels();

    if (isLoading) {
        return (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Available Models</h2>
                <div className="text-sm text-gray-500">Loading models...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-6 p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                <h2 className="text-lg font-semibold mb-2 text-destructive">Available Models</h2>
                <div className="text-sm text-destructive/80">Error loading models: {error.message}</div>
            </div>
        );
    }

    return (
        <div className="mb-6 p-4 border rounded-lg bg-primary/10 border-primary/20">
            <h2 className="text-lg font-semibold mb-3 text-primary">Available Models</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Base Models */}
                <div>
                    <h3 className="font-medium text-primary/80 mb-2">Base Models ({baseModels.length})</h3>
                    {baseModels.length > 0 ? (
                        <div className="space-y-1">
                            {baseModels.map((model) => (
                                <div key={model} className="text-sm bg-background px-2 py-1 rounded border">
                                    {model}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">No base models available</div>
                    )}
                </div>

                {/* Chat Models */}
                <div>
                    <h3 className="font-medium text-primary/80 mb-2">Chat Models ({chatModels.length})</h3>
                    {chatModels.length > 0 ? (
                        <div className="space-y-1">
                            {chatModels.map((model) => (
                                <div key={model} className="text-sm bg-background px-2 py-1 rounded border">
                                    {model}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">No chat models available</div>
                    )}
                </div>
            </div>

            <div className="mt-3 text-xs text-primary/70">
                Total: {models.length} model{models.length !== 1 ? 's' : ''} available
            </div>
        </div>
    );
} 