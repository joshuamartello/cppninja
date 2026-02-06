"use client";

import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  collaborative?: boolean;
  roomId?: string;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  collaborative = false,
  roomId,
  height = "500px",
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Set up collaborative editing if enabled
    if (collaborative && roomId) {
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText("monaco");

      // Connect to WebSocket server for collaboration
      const wsUrl = process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL || "ws://localhost:1234";
      const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
      providerRef.current = provider;

      // Create Monaco binding
      const binding = new MonacoBinding(
        ytext,
        editor.getModel()!,
        new Set([editor]),
        provider.awareness
      );
      bindingRef.current = binding;
    }

    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      renderLineHighlight: "all",
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup collaborative connections
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
    };
  }, []);

  const handleChange = (newValue: string | undefined) => {
    if (onChange && newValue !== undefined) {
      onChange(newValue);
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        width="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          renderLineHighlight: "all",
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}

function getMonacoLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    typescript: "typescript",
    go: "go",
    rust: "rust",
  };
  return languageMap[language] || "plaintext";
}
