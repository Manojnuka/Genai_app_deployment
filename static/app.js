// PyPanel.ai Core Application Logic

// Predefined Code Templates
const CODE_TEMPLATES = {
    hello: `# Hello World Template
print("------------------------------------------")
print("🔥 Welcome to PyPanel.ai!")
print("------------------------------------------")

import sys
import platform

print(f"System Platform: {platform.system()} {platform.release()}")
print(f"Python version:  {platform.python_version()}")
print(f"Executing from:  {sys.executable}")
print("\\nLet's run some loops:")

total = 0
for i in range(1, 6):
    squared = i ** 2
    total += squared
    print(f"  Step {i}: {i} squared is {squared}")

print(f"\\nExecution complete! Total sum of squares: {total}")
`,
    summarize: `# FastAPI Summarizer Test Template
# This script tests the local /summarize FastAPI endpoint using standard urllib!

import urllib.request
import json

print("🚀 Simulating client request to Summarizer API on localhost:8000...")

# The FastAPI server URL
url = "http://localhost:8000/summarize"

# Text to summarize
data = {
    "text": "Artificial intelligence is intelligence demonstrated by machines, as opposed to intelligence of humans and other animals. Example tasks in which this is done include speech recognition, computer vision, translation between languages, as well as other mappings of inputs. The field of AI research was founded as an academic discipline in 1956.",
    "max_length": 50
}

# Encode the payload to JSON bytes
payload = json.dumps(data).encode("utf-8")

# Configure request
req = urllib.request.Request(
    url, 
    data=payload, 
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    print("⏳ Sending request to API...")
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        body = response.read().decode("utf-8")
        result = json.loads(body)
        
        print(f"\\n✅ Response Status: {status_code}")
        print("💡 Summarized Text Output:")
        print("==========================================")
        print(result.get("summary"))
        print("==========================================")
except urllib.error.URLError as e:
    print(f"\\n❌ Error contacting backend API: {e}")
    print("👉 Make sure the FastAPI server is running locally on port 8000!")
`,
    analytics: `# ASCII Data Analytics Simulator
# Simulates numerical dataset computing and rendering a clean ASCII distribution histogram

data = [12, 19, 3, 5, 2, 3, 15, 18, 19, 20, 11, 14, 15, 9, 8, 12, 17, 18, 19, 14]

print("📊 Analyzing Numerical Dataset...")
print(f"Dataset Size: {len(data)} items")

# Compute Statistics
mean = sum(data) / len(data)
data_sorted = sorted(data)
median = data_sorted[len(data)//2]
minimum = min(data)
maximum = max(data)

print(f"Minimum: {minimum}")
print(f"Maximum: {maximum}")
print(f"Average: {mean:.2f}")
print(f"Median:  {median}")
print("\\n📈 ASCII Distribution Chart:")
print("------------------------------------------")

# Draw horizontal histogram
buckets = {}
for val in data:
    bucket = (val // 4) * 4
    buckets[bucket] = buckets.get(bucket, 0) + 1

for b in sorted(buckets.keys()):
    stars = "★" * buckets[b]
    print(f" {b:2d} - {b+3:2d} | {stars:<15} ({buckets[b]} values)")

print("------------------------------------------")
print("✅ Analytics finished.")
`,
    regex: `# Regex Pattern Validator
import re

print("🔍 Validating user registration datasets...")

email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

test_emails = [
    "user@example.com",
    "invalid-email@com",
    "admin.ninjas@academy.ai",
    "hello@world"
]

print("==========================================")
print(f"{'Email Address':<28} | {'Valid?':<6}")
print("==========================================")

for email in test_emails:
    is_valid = "✅ YES" if re.match(email_pattern, email) else "❌ NO"
    print(f"{email:<28} | {is_valid:<6}")
    
print("==========================================")
`
};

// State Variables
let editorInstance = null;
let currentLanguage = 'python';
let lastRunOutput = { code: "", stdout: "", stderr: "", exitCode: 0 };

// Initialize Monaco Editor
document.addEventListener("DOMContentLoaded", () => {
    // Load Monaco Editor
    if (typeof require !== 'undefined') {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            initializeEditor();
        });
    } else {
        showToast("Error loading Monaco Editor libraries from CDN.", "error");
    }

    // Set up Event Listeners
    setupAppEventListeners();
});

function initializeEditor() {
    const container = document.getElementById('editor-container');
    editorInstance = monaco.editor.create(container, {
        value: CODE_TEMPLATES.hello,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 12, bottom: 12 },
        roundedSelection: true,
        selectOnLineNumbers: true,
        scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
        }
    });

    // Update stats on code changes
    editorInstance.onDidChangeModelContent(() => {
        updateEditorStats();
    });

    // Keyboard shortcut (Ctrl + Enter) to run code
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        runCode();
    });

    updateEditorStats();
}

function updateEditorStats() {
    if (!editorInstance) return;
    const value = editorInstance.getValue();
    const lines = value.split('\n').length;
    const chars = value.length;
    document.getElementById("editor-stats").textContent = `Lines: ${lines} | Chars: ${chars}`;
}

// Event Listeners
function setupAppEventListeners() {
    // Run Code Trigger
    document.getElementById("run-btn").addEventListener("click", runCode);

    // Format Code
    document.getElementById("format-btn").addEventListener("click", formatCode);

    // Clear Code
    document.getElementById("clear-editor-btn").addEventListener("click", () => {
        if (editorInstance) {
            editorInstance.setValue("");
            showToast("Editor cleared", "info");
        }
    });

    // Template Dropdown
    document.getElementById("template-select").addEventListener("change", (e) => {
        const val = e.target.value;
        if (editorInstance && CODE_TEMPLATES[val]) {
            editorInstance.setValue(CODE_TEMPLATES[val]);
            showToast(`Loaded template: ${e.target.options[e.target.selectedIndex].text}`, "success");
        }
    });

    // Tab Navigation
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            // Switch button classes
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Switch pane visibility
            const tabPanes = document.querySelectorAll(".tab-pane");
            tabPanes.forEach(pane => pane.classList.remove("active"));
            document.getElementById(`tab-${targetTab}`).classList.add("active");
        });
    });

    // Clear Terminal Output
    document.getElementById("clear-term-btn").addEventListener("click", () => {
        const screen = document.getElementById("terminal-screen");
        screen.innerHTML = `
            <div class="term-line system-msg">Console cleared. Ready to execute code.</div>
            <div class="term-line prompt-line"><span class="prompt-symbol">PS C:\\Users\\user\\CodingNinjas_AI\\Practise\\Code files&gt;</span> <span class="cursor-blink"></span></div>
        `;
        showToast("Terminal console cleared", "info");
    });

    // AI Assist: Prompt Send
    document.getElementById("ai-send-btn").addEventListener("click", sendAIPrompt);
    document.getElementById("ai-prompt-input").addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            sendAIPrompt();
        }
    });

    // AI Assist: Quick Actions
    document.getElementById("ai-explain-btn").addEventListener("click", explainCurrentCode);
    document.getElementById("ai-refactor-btn").addEventListener("click", refactorCurrentCode);
}

// Formatting Utilities
function formatCode() {
    if (!editorInstance) return;
    
    // We can run Monaco's built-in format action
    editorInstance.getAction('editor.action.formatDocument').run().then(() => {
        showToast("Code formatted", "success");
    }).catch(() => {
        // Fallback simple trim formatter
        const val = editorInstance.getValue();
        const formatted = val.split('\n').map(line => line.trimEnd()).join('\n');
        editorInstance.setValue(formatted);
        showToast("Whitespace cleaned", "success");
    });
}

// Runner Logic
async function runCode() {
    if (!editorInstance) return;
    
    const runBtn = document.getElementById("run-btn");
    const statusDot = document.querySelector(".status-dot");
    const statusLabel = document.querySelector(".status-label");
    const termScreen = document.getElementById("terminal-screen");
    const editorStatus = document.getElementById("editor-status");

    const code = editorInstance.getValue();
    if (!code.trim()) {
        showToast("Code editor is empty!", "error");
        return;
    }

    // Set Loading States
    runBtn.disabled = true;
    runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Running...`;
    statusDot.className = "status-dot busy";
    statusLabel.textContent = "Running Process...";
    editorStatus.textContent = "Executing...";

    // Append Command echo to terminal
    const promptLine = termScreen.querySelector(".prompt-line");
    if (promptLine) {
        promptLine.remove();
    }
    
    const cmdEcho = document.createElement("div");
    cmdEcho.className = "term-line command-echo";
    cmdEcho.innerHTML = `<span class="prompt-symbol">PS C:\\Users\\user\\CodingNinjas_AI\\Practise\\Code files&gt;</span> python3 main.py`;
    termScreen.appendChild(cmdEcho);

    showToast("Starting code execution...", "info");

    try {
        const response = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache outputs for debugging/AI
        lastRunOutput = {
            code: code,
            stdout: data.stdout || "",
            stderr: data.stderr || "",
            exitCode: data.exit_code
        };

        // Render Outputs in terminal
        if (data.stdout) {
            const outLine = document.createElement("div");
            outLine.className = "term-line stdout-line";
            outLine.textContent = data.stdout;
            termScreen.appendChild(outLine);
        }

        if (data.stderr) {
            const errLine = document.createElement("div");
            errLine.className = "term-line stderr-line";
            errLine.textContent = data.stderr;
            termScreen.appendChild(errLine);

            // Append floating AI Explain button inside terminal!
            const ctaLine = document.createElement("div");
            ctaLine.className = "term-line error-explain-cta";
            ctaLine.innerHTML = `
                <button class="term-explain-btn" onclick="triggerAIErrorExplanation()">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Explain Error with Gemini
                </button>
            `;
            termScreen.appendChild(ctaLine);
        }

        // Render Return Status
        const statusLine = document.createElement("div");
        statusLine.className = "term-line execution-success";
        statusLine.textContent = `\n[Process finished with exit code ${data.exit_code} in ${data.elapsed_time.toFixed(3)}s]`;
        termScreen.appendChild(statusLine);

        // Update Diagnostics panel metrics
        document.getElementById("metric-execution-time").textContent = `${data.elapsed_time.toFixed(3)}s`;
        const exitStatus = document.getElementById("metric-exit-status");
        const exitCodeEl = document.getElementById("metric-exit-code");
        
        exitCodeEl.textContent = `Exit Code: ${data.exit_code}`;
        if (data.exit_code === 0) {
            exitStatus.textContent = "Success";
            exitStatus.style.color = "var(--color-success)";
            showToast("Execution completed successfully!", "success");
        } else {
            exitStatus.textContent = "Failed";
            exitStatus.style.color = "var(--color-error)";
            showToast("Execution failed with errors.", "error");
        }

    } catch (err) {
        console.error(err);
        const errLine = document.createElement("div");
        errLine.className = "term-line stderr-line";
        errLine.textContent = `Execution Client Error: ${err.message}\nFailed to contact Python Sandbox Backend.`;
        termScreen.appendChild(errLine);
        showToast("Runner service error", "error");
    } finally {
        // Reset states
        runBtn.disabled = false;
        runBtn.innerHTML = `<i class="fa-solid fa-play"></i> Run Code`;
        statusDot.className = "status-dot online";
        statusLabel.textContent = "Backend Connected";
        editorStatus.textContent = "Ready";

        // Re-append blink prompt line at end
        const newPrompt = document.createElement("div");
        newPrompt.className = "term-line prompt-line";
        newPrompt.innerHTML = `<span class="prompt-symbol">PS C:\\Users\\user\\CodingNinjas_AI\\Practise\\Code files&gt;</span> <span class="cursor-blink"></span>`;
        termScreen.appendChild(newPrompt);

        // Scroll terminal to bottom
        termScreen.scrollTop = termScreen.scrollHeight;
    }
}

// AI Assist functions
async function sendAIPrompt() {
    const input = document.getElementById("ai-prompt-input");
    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = "";
    appendChatMessage("user", prompt);

    // Show AI loading bubble
    const loadingId = appendChatLoadingBubble();

    try {
        const currentCode = editorInstance ? editorInstance.getValue() : "";
        const response = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: prompt,
                current_code: currentCode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        removeChatLoadingBubble(loadingId);
        
        renderAIResponse(data.result);
    } catch (err) {
        removeChatLoadingBubble(loadingId);
        appendChatMessage("assistant", `❌ Error during AI generation: ${err.message}`);
        showToast("Gemini generation failed", "error");
    }
}

async function explainCurrentCode() {
    if (!editorInstance) return;
    const code = editorInstance.getValue();
    if (!code.trim()) {
        showToast("Code editor is empty!", "error");
        return;
    }

    // Switch to AI tab
    switchTab("ai-assistant");
    appendChatMessage("user", "Explain the active Python script in detail.");

    const loadingId = appendChatLoadingBubble();

    try {
        const response = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: code,
                stdout: lastRunOutput.stdout,
                stderr: lastRunOutput.stderr,
                exit_code: lastRunOutput.exitCode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        removeChatLoadingBubble(loadingId);
        renderAIResponse(data.explanation);
    } catch (err) {
        removeChatLoadingBubble(loadingId);
        appendChatMessage("assistant", `❌ Error analyzing code: ${err.message}`);
    }
}

async function refactorCurrentCode() {
    if (!editorInstance) return;
    const code = editorInstance.getValue();
    if (!code.trim()) {
        showToast("Code editor is empty!", "error");
        return;
    }

    switchTab("ai-assistant");
    appendChatMessage("user", "Refactor and optimize the current active script, keeping the core functionality.");

    const loadingId = appendChatLoadingBubble();

    try {
        const response = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: "Optimize, refactor, and format this python code. Suggest performance optimizations, robust exceptions, and clean docstrings.",
                current_code: code
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        removeChatLoadingBubble(loadingId);
        renderAIResponse(data.result);
    } catch (err) {
        removeChatLoadingBubble(loadingId);
        appendChatMessage("assistant", `❌ Error refactoring code: ${err.message}`);
    }
}

// Triggered by "Explain Error with Gemini" CTA button inside terminal
window.triggerAIErrorExplanation = async function() {
    switchTab("ai-assistant");
    appendChatMessage("user", "Explain the execution error I just ran into.");

    const loadingId = appendChatLoadingBubble();

    try {
        const response = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: lastRunOutput.code,
                stdout: lastRunOutput.stdout,
                stderr: lastRunOutput.stderr,
                exit_code: lastRunOutput.exitCode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        removeChatLoadingBubble(loadingId);
        renderAIResponse(data.explanation);
    } catch (err) {
        removeChatLoadingBubble(loadingId);
        appendChatMessage("assistant", `❌ Error analyzing exception: ${err.message}`);
    }
}

// AI Parsing & Chat Rendering
function appendChatMessage(role, text) {
    const history = document.getElementById("ai-chat-history");
    const msgDiv = document.createElement("div");
    msgDiv.className = `ai-msg ai-${role}`;

    const icon = role === "user" ? "fa-user" : "fa-wand-magic-sparkles";
    msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid ${icon}"></i></div>
        <div class="msg-bubble">${formatMarkdown(text)}</div>
    `;

    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
}

function appendChatLoadingBubble() {
    const history = document.getElementById("ai-chat-history");
    const loadingDiv = document.createElement("div");
    const id = "loading-" + Date.now();
    loadingDiv.id = id;
    loadingDiv.className = "ai-msg ai-assistant";
    loadingDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-spinner fa-spin"></i></div>
        <div class="msg-bubble loading-shimmer" style="height: 50px; border-radius: 12px; width: 80%;"></div>
    `;
    history.appendChild(loadingDiv);
    history.scrollTop = history.scrollHeight;
    return id;
}

function removeChatLoadingBubble(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function renderAIResponse(text) {
    const history = document.getElementById("ai-chat-history");
    const msgDiv = document.createElement("div");
    msgDiv.className = "ai-msg ai-assistant";
    
    // Check if response contains a Python code block
    const codeBlockRegex = /```python([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(text);
    
    let bubbleContent = formatMarkdown(text);
    msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="msg-bubble">${bubbleContent}</div>
    `;
    
    history.appendChild(msgDiv);

    // If there was a Python block, append a beautiful "Insert Code" helper block!
    if (match && match[1]) {
        const rawCode = match[1].trim();
        const insertCard = document.createElement("div");
        insertCard.className = "ai-insert-card";
        insertCard.innerHTML = `
            <div class="ai-insert-text">
                <i class="fa-solid fa-arrow-left"></i> A Python script was generated by Gemini.
            </div>
            <button class="ai-insert-btn">
                <i class="fa-solid fa-file-import"></i> Apply to Editor
            </button>
        `;
        
        insertCard.querySelector(".ai-insert-btn").addEventListener("click", () => {
            if (editorInstance) {
                editorInstance.setValue(rawCode);
                showToast("Code applied to editor", "success");
                switchTab("terminal");
            }
        });
        
        msgDiv.querySelector(".msg-bubble").appendChild(insertCard);
    }
    
    history.scrollTop = history.scrollHeight;
}

// Simple local markdown-to-HTML parser for beautiful layout
function formatMarkdown(text) {
    // Escape HTML tags to prevent XSS
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Code blocks formatting
    escaped = escaped.replace(/```python([\s\S]*?)```/g, '<pre><code class="language-python">$1</code></pre>');
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code formatting
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold text formatting
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Bullet list formatting
    escaped = escaped.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
    escaped = escaped.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Replace linebreaks with paragraphs or linebreaks
    return escaped.split('\n\n').map(p => {
        if (p.startsWith('<pre>') || p.startsWith('<ul>') || p.startsWith('<li>')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

// Tab Switching utility
function switchTab(tabId) {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.click();
        }
    });
}

// Toast System
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-exclamation";
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.style.animation = "toast-in 0.3s reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
