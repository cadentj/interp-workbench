import { useWorkspace } from "@/stores/useWorkspace";
import { Copy, Loader2, PanelRight, PanelRightClose } from "lucide-react";
import { getChartById } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useCallback } from "react";

import { HeatmapCard } from "./heatmap/HeatmapCard";
import { LineCard } from "./line/LineCard";
import CodeExport from "@/app/workbench/[workspaceId]/components/CodeExport";
import { Button } from "../ui/button";
import { BorderBeam } from "../magicui/border-beam";
import { HeatmapChart, LineChart } from "@/db/schema";
import { useCapture } from "@/components/providers/CaptureProvider";

export function ChartDisplay() {
    const { annotationsOpen, setAnnotationsOpen, jobStatus } = useWorkspace();
    const params = useParams<{ workspaceId?: string; chartId?: string }>();
    const chartIdParam = params?.chartId as string | undefined;

    const { captureRef, handleCopyPng, captureChartThumbnail } = useCapture();

    // Fetch the single chart by id
    const { data: singleChart, isLoading: isLoadingSingle } = useQuery({
        queryKey: ["chartById", chartIdParam],
        queryFn: () => getChartById(chartIdParam as string),
        enabled: !!chartIdParam,
    });

    const activeChart = useMemo(() => singleChart || null, [singleChart]);

    // Thumbnail capture is triggered directly by queries via provider

    const onCopyPng = useCallback(async () => {
        await handleCopyPng();
    }, [handleCopyPng]);

    if (isLoadingSingle) return (
        <div className="flex-1 flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar relative">
            <div className="px-2 py-2 flex items-center bg-background justify-end h-12 border-b">
                <div className="flex items-center gap-2">
                    <CodeExport chartId={activeChart?.id} chartType={activeChart?.type as ("line"|"heatmap"|null|undefined)} />
                    <Button variant="outline" size="sm" onClick={onCopyPng}><Copy className="h-4 w-4" /> Copy</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center" onClick={() => {
                        setAnnotationsOpen(!annotationsOpen);
                    }}>
                        {annotationsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {activeChart && activeChart.type === "heatmap" && (activeChart.data !== null) ? (
                <HeatmapCard captureRef={captureRef} chart={activeChart as HeatmapChart} />
            ) : activeChart && activeChart.data !== null ? (
                <LineCard captureRef={captureRef} chart={activeChart as LineChart} />
            ) : (
                <div className="flex-1 flex h-full items-center relative justify-center border m-2 border-dashed rounded">
                    {jobStatus !== "idle" && <BorderBeam duration={5}
                        size={300}
                        className="from-transparent bg-primary to-transparent" />}
                    <div className="text-muted-foreground">No chart data</div>
                </div>
            )}
        </div>
    );
}