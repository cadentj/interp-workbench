import { useEffect, useState } from "react";
import type { TokenPredictions } from "@/types/workspace";
import type { LensCompletion } from "@/types/lens";
import { Input } from "@/components/ui/input";
import { tokenizeText, decodeTokenIds } from "@/actions/tokenize";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useLensCompletions } from "@/stores/useLensCompletions";

interface TokenBadge {
    text: string;
    probability: number;
    id: number;
}

interface TokenDisplayProps {
    predictions: TokenPredictions;
    selectedIdx: number;
    handleTargetTokenUpdate: (text: string) => void;
    tempTokenText: string[];
    compl: LensCompletion;
}

const TokenDisplay = ({
    predictions,
    selectedIdx,
    handleTargetTokenUpdate,
    tempTokenText,
    compl,
}: TokenDisplayProps) => {
    const [targetToken, setTargetToken] = useState<string>("");
    const [decodedTokens, setDecodedTokens] = useState<string[]>([]);
    const [tokenBadges, setTokenBadges] = useState<TokenBadge[]>([]);
    const [notificationMessage, setNotificationMessage] = useState<string>("");
    const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

    // Decode token IDs when predictions change
    useEffect(() => {
        const decodeTokens = async () => {
            if (!predictions[selectedIdx]?.ids) {
                setDecodedTokens([]);
                return;
            }

            try {
                // Only decode the first 3 tokens
                const topTokenIds = predictions[selectedIdx].ids.slice(0, 3);
                const decoded = await decodeTokenIds(topTokenIds, compl.model);
                setDecodedTokens(decoded);
            } catch (error) {
                console.error("Error decoding tokens:", error);
                setDecodedTokens([]);
            }
        };

        decodeTokens();
    }, [predictions, selectedIdx]);

    const fixString = (str: string | undefined) => {
        if (!str) return "";
        return str.replace(" ", "_");
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && targetToken) {
            await handleTokenSubmit(targetToken);
        }
    };

    const handleTokenSubmit = async (text: string) => {
        try {
            const tokens = await tokenizeText(text, compl.model, false);
            if (!tokens || tokens.length === 0) return;

            // Only process if there's a single token
            if (tokens.length === 1) {
                const tokenId = tokens[0].id;

                // Find the probability of this token in current predictions
                const tokenIndex = predictions[selectedIdx]?.ids.findIndex((id) => id === tokenId);

                // Clear any existing user badges (only one target token)
                setTokenBadges([]);

                if (tokenIndex === -1) {
                    // Token not in predictions - add it as a user badge with probability 0
                    setTokenBadges([
                        {
                            text: tokens[0].text,
                            probability: 0,
                            id: tokenId,
                        },
                    ]);
                    // Don't set selectedPredictionId since it's not a prediction
                    setSelectedPredictionId(null);
                } else {
                    // Token is in predictions - mark it as selected
                    setSelectedPredictionId(tokenId);
                }

                setNotificationMessage("");

                // Update the token in the completion
                handleTargetTokenUpdate(text);
                setTargetToken("");
            } else {
                // Show notification for multi-token input
                setNotificationMessage(
                    `Input "${text}" tokenizes to ${tokens.length} tokens. Please enter a single token.`
                );
                setTimeout(() => setNotificationMessage(""), 3000);
                setTargetToken(""); // Clear the input field
            }
        } catch (error) {
            console.error("Error tokenizing text:", error);
        }
    };

    const removeBadge = (badgeId: number) => {
        setTokenBadges((prev) => prev.filter((badge) => badge.id !== badgeId));
        // Also clear selection if this was the selected prediction token
        if (selectedPredictionId === badgeId) {
            setSelectedPredictionId(null);
        }
    };

    const togglePredictionSelection = (tokenId: number, tokenText: string) => {
        if (selectedPredictionId === tokenId) {
            // Deselect if already selected
            setSelectedPredictionId(null);
            // Clear the target token
            handleTargetTokenUpdate("");
        } else {
            // Select this token
            setSelectedPredictionId(tokenId);
            // Clear any user-added badges when selecting a prediction
            setTokenBadges([]);
            // Set as target token
            handleTargetTokenUpdate(tokenText);
        }
    };

    // Create prediction badges from top predictions
    const predictionBadges = decodedTokens.map((tokenStr: string, idx: number) => ({
        text: tokenStr,
        probability: predictions[selectedIdx].values[idx],
        id: predictions[selectedIdx].ids[idx],
        isPrediction: true,
    }));

    // Combine prediction badges with user-added badges
    const allBadges = [
        ...predictionBadges,
        ...tokenBadges.map((badge) => ({ ...badge, isPrediction: false })),
    ];

    return (
        <div className="space-y-3" id="predictions-display">
            {/* Notification message */}
            {notificationMessage && (
                <div className="text-xs border bg-destructive/50 text-destructive-foreground border-destructive-foreground/50 h-8 px-3 flex items-center rounded">
                    {notificationMessage}
                </div>
            )}

            {/* All badges displayed inline */}
            <div className="flex flex-wrap gap-2 items-center">
                {allBadges.map((badge, index) => {
                    const isSelected = selectedPredictionId === badge.id;
                    const shouldHighlight = !badge.isPrediction || isSelected;

                    return (
                        <div
                            key={`${badge.id}-${badge.isPrediction ? "pred" : "user"}`}
                            className={`inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors ${
                                shouldHighlight
                                    ? "border border-primary"
                                    : "border border-transparent"
                            }`}
                            onClick={
                                badge.isPrediction
                                    ? () => togglePredictionSelection(badge.id, badge.text)
                                    : () => removeBadge(badge.id)
                            }
                            title={
                                badge.isPrediction
                                    ? isSelected
                                        ? "Click to deselect"
                                        : "Click to select"
                                    : "Click to remove"
                            }
                        >
                            <span className="font-medium">{fixString(badge.text)}</span>
                            <span className="ml-1 text-xs opacity-70">
                                {badge.probability.toFixed(4)}
                            </span>
                        </div>
                    );
                })}
                {tempTokenText.length > 1 && (
                    <div className="text-xs text-red-500 bg-red-500/10 border border-red-200 px-2 py-1 rounded">
                        Multi-token input: {tempTokenText.join(" + ")} ({tempTokenText.length}{" "}
                        tokens)
                    </div>
                )}
            </div>

            {/* Input field */}
            <div className="border-t flex items-center gap-2 pt-3">
                <Input
                    className="h-8"
                    placeholder="Enter a target token and press Enter"
                    value={targetToken}
                    onChange={(e) => setTargetToken(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTokenSubmit(targetToken)}
                >
                    <Plus size={16} className="w-8 h-8" />
                </Button>
            </div>
        </div>
    );
};

interface PredictionDisplayProps {
    predictions: TokenPredictions;
    compl: LensCompletion;
    selectedIdx: number;
}

export const PredictionDisplay = ({ predictions, compl, selectedIdx }: PredictionDisplayProps) => {
    const [tempTokenText, setTempTokenText] = useState<string[]>([]);

    const updateToken = (idx: number, targetId: number, targetText: string) => {
        const { handleUpdateCompletion } = useLensCompletions.getState();

        const currentTokens = compl.tokens || [];
        handleUpdateCompletion(compl.id, {
            tokens: currentTokens.map((t) =>
                t.idx === idx ? { ...t, target_id: targetId, target_text: targetText } : t
            ),
        });
    };

    const clearToken = (tokenIdx: number) => {
        const { handleUpdateCompletion } = useLensCompletions.getState();
        const currentTokens = compl.tokens || [];
        handleUpdateCompletion(compl.id, {
            tokens: currentTokens.map((t) =>
                t.idx === tokenIdx ? { ...t, target_id: -1, target_text: "" } : t
            ),
        });
    };

    const handleTargetTokenUpdate = async (text: string) => {
        try {
            const tokens = await tokenizeText(text, compl.model, false);
            if (!tokens || tokens.length === 0) return;

            // Only update if there's a single token
            if (tokens.length === 1) {
                updateToken(selectedIdx, tokens[0].id, tokens[0].text);
                setTempTokenText([]);
            } else {
                // Else, set temp token text and clear tokens
                setTempTokenText(tokens.map((t) => t.text));
                clearToken(selectedIdx);
            }
        } catch (error) {
            console.error("Error tokenizing text:", error);
        }
    };

    return (
        <>
            {predictions && predictions[selectedIdx] ? (
                <TokenDisplay
                    predictions={predictions}
                    selectedIdx={selectedIdx}
                    handleTargetTokenUpdate={handleTargetTokenUpdate}
                    tempTokenText={tempTokenText}
                    compl={compl}
                />
            ) : (
                <div className="text-sm text-muted-foreground">No token selected</div>
            )}
        </>
    );
};
