import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logPath = path.join(process.cwd(), "security.log");
    
    if (!fs.existsSync(logPath)) {
      return NextResponse.json([]);
    }

    const fileContent = fs.readFileSync(logPath, "utf-8");
    const lines = fileContent.trim().split("\n");
    
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { message: line, timestamp: new Date().toISOString() };
      }
    }).reverse(); // Latest first

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to read audit logs:", error);
    return NextResponse.json({ error: "Failed to read audit logs" }, { status: 500 });
  }
}
