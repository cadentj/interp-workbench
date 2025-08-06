"use server";

import config from "@/lib/config";
import type { Token } from "@/types/models";
import { toast } from "sonner";

export async function encodeText(text: string, model: string, addSpecialTokens: boolean = true): Promise<Token[]> {
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.encode), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
                model: model,
                addSpecialTokens: addSpecialTokens,
            }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        toast("Error encoding text");
        return [];
    }
}

interface DecodeResponse {
    text: string;
}

interface BatchDecodeResponse {
    texts: string[];
}

export async function decodeText(
    tokenIds: number[],
    model: string,
    batch: boolean = false
): Promise<DecodeResponse | BatchDecodeResponse> {
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.decode), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tokenIds, model, batch }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        toast.error("Error decoding text");
        return { texts: [] };
    }
}
