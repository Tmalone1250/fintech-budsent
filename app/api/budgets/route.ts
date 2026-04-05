import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "budgets.json");
    const data = await fs.readFile(filePath, "utf-8");
    const budgetsJson = JSON.parse(data);

    // Map the JSON structure to what the frontend expects
    const names: Record<string, string> = {
      "agent_001": "Procurement Bot",
      "agent_002": "Marketing AI",
      "agent_003": "Compute Autoscaler"
    };

    const colors: Record<string, string> = {
      "agent_001": "bg-emerald-500",
      "agent_002": "bg-blue-500",
      "agent_003": "bg-amber-500"
    };

    const budgets = Object.entries(budgetsJson).map(([id, data]: [string, any]) => ({
      id,
      name: names[id] || id,
      limit: data.authorized_limit,
      spent: data.spent_amount,
      color: colors[id] || "bg-slate-500"
    }));

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Fetch Budgets Error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}
