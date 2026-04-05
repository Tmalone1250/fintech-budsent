import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Trigger API Request Body:", body);
    const { agent_id, amount, merchant_url, request_id } = body;

    if (agent_id === undefined || amount === undefined || request_id === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        received: { agent_id, amount, request_id } 
      }, { status: 400 });
    }

    // Prepare the command to run sentinel.py
    // We pass the transaction data as a JSON string to a temporary script or via stdin
    // For simplicity, we'll create a small trigger command
    const pythonPath = "python"; // Assuming python is in PATH
    const scriptPath = path.join(process.cwd(), "sentinel.py");
    
    // We'll use a temporary python snippet to call the process_transaction method
    const triggerCode = `
import json
from sentinel import BudgetSentinel
from models import TransactionIntent

sentinel = BudgetSentinel()
result = sentinel.process_transaction(
    agent_id="${agent_id}",
    amount=${amount},
    request_id="${request_id}"
)
print(json.dumps(result))
`;

    // Run the python snippet via a temporary file to avoid shell quoting issues on Windows
    const tempScriptPath = path.join(process.cwd(), `trigger_${request_id}.py`);
    const fs = require('fs/promises');
    await fs.writeFile(tempScriptPath, triggerCode);

    let stdout, stderr;
    try {
      const execResult = await execAsync(`${pythonPath} "${tempScriptPath}"`);
      stdout = execResult.stdout;
      stderr = execResult.stderr;
    } catch (error: any) {
      stdout = error.stdout;
      stderr = error.stderr;
    } finally {
      await fs.unlink(tempScriptPath).catch(() => {});
    }

    if (stderr && !stdout) {
      console.error("Python Error:", stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    try {
      const result = JSON.parse(stdout);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse sentinel output", output: stdout }, { status: 500 });
    }

  } catch (error) {
    console.error("Trigger API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
