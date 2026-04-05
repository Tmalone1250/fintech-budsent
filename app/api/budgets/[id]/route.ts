import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

async function runSentinelCommand(params: { command: string, agent_id: string, value?: number }) {
  const pythonPath = "python";
  const scriptPath = path.join(process.cwd(), "sentinel.py");
  
  const requestId = Math.random().toString(36).substring(7);
  const tempScriptPath = path.join(process.cwd(), `sentinel_cmd_${requestId}.py`);
  
  let pythonCode = "";
  if (params.command === "update") {
    pythonCode = `
import json
from sentinel import BudgetSentinel
sentinel = BudgetSentinel()
success = sentinel.update_budget("${params.agent_id}", ${params.value})
print(json.dumps(success))
`;
  } else if (params.command === "revoke") {
    pythonCode = `
import json
from sentinel import BudgetSentinel
sentinel = BudgetSentinel()
success = sentinel.revoke_agent("${params.agent_id}")
print(json.dumps(success))
`;
  }

  await fs.writeFile(tempScriptPath, pythonCode);

  try {
    const { stdout, stderr } = await execAsync(`${pythonPath} "${tempScriptPath}"`);
    if (stderr && !stdout) throw new Error(stderr);
    return JSON.parse(stdout);
  } finally {
    await fs.unlink(tempScriptPath).catch(() => {});
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15+
) {
  try {
    const { authorized_limit } = await request.json();
    const { id } = await params;

    if (authorized_limit === undefined) {
      return NextResponse.json({ error: "Missing authorized_limit" }, { status: 400 });
    }

    const result = await runSentinelCommand({ 
      command: "update", 
      agent_id: id, 
      value: authorized_limit 
    });

    if (result === true) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: `Update failed in sentinel for agent ${id}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("PATCH Budget Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await runSentinelCommand({ 
      command: "revoke", 
      agent_id: id 
    });

    if (result === true) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: `Revocation failed in sentinel for agent ${id}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("DELETE Budget Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
