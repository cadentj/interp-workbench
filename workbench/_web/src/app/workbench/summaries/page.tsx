"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnnotations } from "@/stores/useAnnotations";
import { useCharts } from "@/stores/useCharts";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft,
    FileText,
    Download,
    Eye,
    Settings,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CircleDotDashed,
    Spline,
    Grid3X3,
    ALargeSmall,
    FolderOpen
} from "lucide-react";
import type { Annotation, AnnotationGroup } from "@/stores/useAnnotations";

interface ReportConfig {
    title: string;
    author: string;
    description: string;
    includeMethodology: boolean;
    includeTimestamps: boolean;
    selectedCharts: Set<number>;
    selectedGroups: Set<string>;
    selectedAnnotations: Set<string>;
}

export default function ReportBuilderPage() {
    const router = useRouter();
    const { annotations, groups } = useAnnotations();
    const { gridPositions } = useCharts();
    const { activeCompletions } = useLensCompletions();
    
    const [reportConfig, setReportConfig] = useState<ReportConfig>({
        title: "Experiment Report",
        author: "",
        description: "",
        includeMethodology: true,
        includeTimestamps: false,
        selectedCharts: new Set(gridPositions.map((_, index) => index)),
        selectedGroups: new Set(groups.map(g => g.id)),
        selectedAnnotations: new Set(annotations.map(a => a.data.id)),
    });
    
    const [activeTab, setActiveTab] = useState("configure");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    
    // Get all annotations including those in groups
    const allAnnotations = useMemo(() => {
        const ungroupedAnnotations = annotations;
        const groupedAnnotations = groups.flatMap((group: AnnotationGroup) => 
            group.annotations.map((annotation: Annotation) => ({
                ...annotation,
                data: { ...annotation.data, groupId: group.id }
            }))
        );
        return [...ungroupedAnnotations, ...groupedAnnotations];
    }, [annotations, groups]);
    
    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };
    
    const toggleGroupSelection = (groupId: string) => {
        const newSelected = new Set(reportConfig.selectedGroups);
        const group = groups.find(g => g.id === groupId);
        
        if (!group) return;
        
        if (newSelected.has(groupId)) {
            newSelected.delete(groupId);
            // Deselect all annotations in the group
            const newAnnotations = new Set(reportConfig.selectedAnnotations);
            group.annotations.forEach(a => newAnnotations.delete(a.data.id));
            setReportConfig({
                ...reportConfig,
                selectedGroups: newSelected,
                selectedAnnotations: newAnnotations
            });
        } else {
            newSelected.add(groupId);
            // Select all annotations in the group
            const newAnnotations = new Set(reportConfig.selectedAnnotations);
            group.annotations.forEach(a => newAnnotations.add(a.data.id));
            setReportConfig({
                ...reportConfig,
                selectedGroups: newSelected,
                selectedAnnotations: newAnnotations
            });
        }
    };
    
    const toggleAnnotationSelection = (annotationId: string) => {
        const newSelected = new Set(reportConfig.selectedAnnotations);
        if (newSelected.has(annotationId)) {
            newSelected.delete(annotationId);
        } else {
            newSelected.add(annotationId);
        }
        setReportConfig({ ...reportConfig, selectedAnnotations: newSelected });
    };
    
    const toggleChartSelection = (index: number) => {
        const newSelected = new Set(reportConfig.selectedCharts);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setReportConfig({ ...reportConfig, selectedCharts: newSelected });
    };
    
    const getAnnotationIcon = (type: Annotation["type"]) => {
        switch (type) {
            case "lineGraph":
                return CircleDotDashed;
            case "lineGraphRange":
                return Spline;
            case "heatmap":
                return Grid3X3;
            case "token":
                return ALargeSmall;
        }
    };
    
    const buildReport = () => {
        // In a real implementation, this would generate a downloadable report
        // For now, we'll just log the configuration
        console.log("Building report with config:", reportConfig);
        alert("Report building functionality would be implemented here!");
    };
    
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Workspace
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                <h1 className="text-xl font-semibold">Report Builder</h1>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setActiveTab("preview")}
                                disabled={activeTab === "preview"}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                            <Button onClick={buildReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="configure">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="configure" className="mt-6 space-y-6">
                        {/* Report Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Report Details</CardTitle>
                                <CardDescription>
                                    Configure the basic information for your report
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Report Title</Label>
                                    <Input
                                        id="title"
                                        value={reportConfig.title}
                                        onChange={(e) => setReportConfig({
                                            ...reportConfig,
                                            title: e.target.value
                                        })}
                                        placeholder="Enter report title..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="author">Author</Label>
                                    <Input
                                        id="author"
                                        value={reportConfig.author}
                                        onChange={(e) => setReportConfig({
                                            ...reportConfig,
                                            author: e.target.value
                                        })}
                                        placeholder="Your name..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={reportConfig.description}
                                        onChange={(e) => setReportConfig({
                                            ...reportConfig,
                                            description: e.target.value
                                        })}
                                        placeholder="Describe the purpose and findings of this report..."
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="methodology"
                                            checked={reportConfig.includeMethodology}
                                            onCheckedChange={(checked: boolean) => setReportConfig({
                                                ...reportConfig,
                                                includeMethodology: checked
                                            })}
                                        />
                                        <Label htmlFor="methodology">
                                            Include methodology section
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="timestamps"
                                            checked={reportConfig.includeTimestamps}
                                            onCheckedChange={(checked: boolean) => setReportConfig({
                                                ...reportConfig,
                                                includeTimestamps: checked
                                            })}
                                        />
                                        <Label htmlFor="timestamps">
                                            Include timestamps
                                        </Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Chart Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Charts</CardTitle>
                                <CardDescription>
                                    Select which charts to include in the report
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {gridPositions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No charts in the workspace
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {gridPositions.map((position, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`chart-${index}`}
                                                    checked={reportConfig.selectedCharts.has(index)}
                                                    onCheckedChange={() => toggleChartSelection(index)}
                                                />
                                                <Label
                                                    htmlFor={`chart-${index}`}
                                                    className="cursor-pointer"
                                                >
                                                    Chart {index + 1} - {position.chartMode === 0 ? "Line Graph" : "Heatmap"}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Annotation Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Annotations & Collections</CardTitle>
                                <CardDescription>
                                    Select which annotations and collections to include
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Groups */}
                                {groups.map((group) => (
                                    <div key={group.id} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => toggleGroup(group.id)}
                                                >
                                                    {expandedGroups.has(group.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Checkbox
                                                    checked={reportConfig.selectedGroups.has(group.id)}
                                                    onCheckedChange={() => toggleGroupSelection(group.id)}
                                                />
                                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{group.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({group.annotations.length})
                                                </span>
                                            </div>
                                        </div>
                                        {expandedGroups.has(group.id) && (
                                            <div className="ml-8 space-y-2 mt-2">
                                                {group.annotations.map((annotation) => {
                                                    const Icon = getAnnotationIcon(annotation.type);
                                                    return (
                                                        <div key={annotation.data.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                checked={reportConfig.selectedAnnotations.has(annotation.data.id)}
                                                                onCheckedChange={() => toggleAnnotationSelection(annotation.data.id)}
                                                            />
                                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                                            <Label className="cursor-pointer text-sm">
                                                                {annotation.data.text.substring(0, 50)}
                                                                {annotation.data.text.length > 50 && "..."}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {/* Ungrouped Annotations */}
                                {annotations.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                            Ungrouped Annotations
                                        </h4>
                                        {annotations.map((annotation) => {
                                            const Icon = getAnnotationIcon(annotation.type);
                                            return (
                                                <div key={annotation.data.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={reportConfig.selectedAnnotations.has(annotation.data.id)}
                                                        onCheckedChange={() => toggleAnnotationSelection(annotation.data.id)}
                                                    />
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="cursor-pointer text-sm">
                                                        {annotation.data.text.substring(0, 50)}
                                                        {annotation.data.text.length > 50 && "..."}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{reportConfig.title || "Untitled Report"}</CardTitle>
                                {reportConfig.author && (
                                    <CardDescription>By {reportConfig.author}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="prose dark:prose-invert max-w-none">
                                {reportConfig.description && (
                                    <div className="mb-6">
                                        <h3>Overview</h3>
                                        <p>{reportConfig.description}</p>
                                    </div>
                                )}
                                
                                {reportConfig.includeMethodology && (
                                    <div className="mb-6">
                                        <h3>Methodology</h3>
                                        <p>
                                            This report includes {reportConfig.selectedCharts.size} charts and{" "}
                                            {reportConfig.selectedAnnotations.size} annotations from experiments
                                            conducted using the Logit Lens workbench.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mb-6">
                                    <h3>Selected Content</h3>
                                    <ul>
                                        <li>{reportConfig.selectedCharts.size} charts</li>
                                        <li>{reportConfig.selectedGroups.size} annotation groups</li>
                                        <li>{reportConfig.selectedAnnotations.size} total annotations</li>
                                    </ul>
                                </div>
                                
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Full report preview would be rendered here</p>
                                    <p className="text-sm">Charts and annotations would be displayed in a formatted layout</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}