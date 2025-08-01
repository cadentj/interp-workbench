import { NextRequest, NextResponse } from "next/server";
import { updateWorkspace, getWorkspaceById } from "@/lib/queries/workspaceQueries";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const workspace = await getWorkspaceById(resolvedParams.workspaceId);
    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get workspace";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: errorMessage.includes("access denied") ? 403 : 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { name, public: isPublic } = body;

    const updates: { name?: string; public?: boolean } = {};
    if (name !== undefined) updates.name = name;
    if (isPublic !== undefined) updates.public = isPublic;

    const updatedWorkspace = await updateWorkspace(resolvedParams.workspaceId, updates, session.user.id);
    
    return NextResponse.json({ 
      success: true, 
      workspace: updatedWorkspace 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update workspace";
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage
      },
      { status: errorMessage.includes("access denied") ? 403 : 500 }
    );
  }
} 