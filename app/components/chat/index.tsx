"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MonacoEditor } from "@/components/ui/monaco-editor";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs";
import { useBuilderWorkspace } from "@/app/components/builder-workspace/context";
import { cn } from "@/lib/utils";
import {
  fetchModels,
  streamChat,
  type ModelInfo,
} from "@/lib/api-client";
import { deployWebsite } from "@/lib/deploy-client";
import { captureThumbnail } from "@/lib/capture-thumbnail";
import {
  AlertTriangle,
  ArrowUp,
  Code2,
  Eye,
  ExternalLink,
  Loader2,
  MessageSquare,
  Paperclip,
  Rocket,
  X,
} from "lucide-react";
import {
  Article,
  Briefcase,
  Envelope,
  FileText,
  Gift,
  Globe,
} from "@phosphor-icons/react";
import posthog from "posthog-js";
import { DeployDialog } from "./deploy-dialog";
import { ModelSelector } from "./model-selector";
import { ReasoningDisplay } from "./reasoning-display";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface Suggestion {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

type WorkspaceView = "preview" | "code";
type LeftPanelView = "chat" | "code";

const MOCK_CONVERSATION: ConversationMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Create a modern portfolio website for a software developer",
  },
  {
    id: "2",
    role: "assistant",
    content: "I've created a modern, dark-themed portfolio website with a hero section, about section, skills, projects showcase, and contact form. The design features a sleek gradient background and smooth animations.",
  },
  {
    id: "3",
    role: "user",
    content: "Add a testimonials section below the projects",
  },
  {
    id: "4",
    role: "assistant",
    content: "Done! I've added a testimonials section with client quotes, star ratings, and profile images. It blends seamlessly with the existing design.",
  },
];

const MOCK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; min-height: 100vh; }
    .hero { max-width: 640px; margin: 0 auto; padding: 60px 24px; text-align: center; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 12px; }
    .hero p { font-size: 1.1rem; color: #a5b4fc; margin-bottom: 24px; }
    .hero button { padding: 12px 28px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-size: 1rem; cursor: pointer; }
    .section { max-width: 640px; margin: 0 auto; padding: 40px 24px; }
    .section h2 { font-size: 1.5rem; margin-bottom: 16px; border-bottom: 1px solid #4f46e5; padding-bottom: 8px; }
    .cards { display: grid; gap: 16px; }
    .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }
    .card h3 { margin-bottom: 6px; }
    .card p { color: #a5b4fc; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Jane Doe</h1>
    <p>Full-stack developer building delightful web experiences</p>
    <button>View Projects</button>
  </div>
  <div class="section">
    <h2>Projects</h2>
    <div class="cards">
      <div class="card"><h3>Taskly</h3><p>A real-time task management app built with Next.js and WebSockets.</p></div>
      <div class="card"><h3>WeatherNow</h3><p>A beautiful weather dashboard with animated icons and 7-day forecasts.</p></div>
      <div class="card"><h3>CodeSnap</h3><p>Screenshot tool for developers to share beautiful code snippets.</p></div>
    </div>
  </div>
</body>
</html>`;

const SUGGESTIONS: Suggestion[] = [
  {
    id: "invitation",
    label: "Invitation",
    icon: Envelope,
    prompt:
      "Create an elegant event invitation page with a hero title, date and time section, venue details, RSVP button, and a refined color palette.",
  },
  {
    id: "celebration",
    label: "Celebration",
    icon: Gift,
    prompt:
      "Design a festive celebration page with confetti-like accents, hero section, photo gallery, guest messages, and a share section.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Briefcase,
    prompt:
      "Create a modern portfolio website for a software developer with strong hero copy, polished project cards, and clear contact details.",
  },
  {
    id: "resume",
    label: "Resume",
    icon: FileText,
    prompt:
      "Create a single-page professional resume with a clear hierarchy for summary, experience, education, and technical skills.",
  },
  {
    id: "blog",
    label: "Blog",
    icon: Article,
    prompt:
      "Build a clean blog landing page with featured article section, recent posts grid, author info block, and newsletter form.",
  },
  {
    id: "landing",
    label: "Landing Page",
    icon: Globe,
    prompt:
      "Create a product landing page with sticky header, hero CTA, feature cards, testimonials, pricing table, and closing CTA.",
  },
  {
    id: "agency",
    label: "Agency",
    icon: Globe,
    prompt:
      "Build a modern digital agency website with a bold hero section, services grid, case studies, client logos, team section, and contact CTA.",
  },
];

// System prompt is now managed server-side (api_bldr/src/prompts/website-builder.ts).

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createConversationMessage(
  role: ConversationMessage["role"],
  content: string,
  reasoning?: string
): ConversationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...(reasoning ? { reasoning } : {}),
  };
}

function createWebsiteId() {
  const timestamp = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `site-${timestamp}-${suffix}`;
}

function extractHtmlDocument(response: string): string | null {
  const fencedMatch = response.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const trimmed = response.trim();
  const lower = trimmed.toLowerCase();

  const doctypeIndex = lower.indexOf("<!doctype");
  if (doctypeIndex >= 0) {
    return trimmed.slice(doctypeIndex).trim();
  }

  const htmlIndex = lower.indexOf("<html");
  if (htmlIndex >= 0) {
    return trimmed.slice(htmlIndex).trim();
  }

  if (trimmed.startsWith("<") && trimmed.includes("</")) {
    return trimmed;
  }

  return null;
}

function buildWebsitePrompt(userPrompt: string, currentHtml?: string) {
  if (!currentHtml) {
    return userPrompt;
  }

  return `Update the existing website based on the following request.\n\nCurrent HTML:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nUser request:\n${userPrompt}`;
}

function formatRequestError(message: string) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (
    trimmed === "429" ||
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("rate-limited")
  ) {
    return {
      title: "Traffic is high right now",
      description:
        "The model provider is temporarily rate-limited. We already tried available fallbacks, so please retry in 20-30 seconds.",
    };
  }

  if (lower.includes("temporarily unavailable") || lower.includes("provider")) {
    return {
      title: "Model service is temporarily unavailable",
      description:
        "Please retry shortly. If this keeps happening, switch models and try again.",
    };
  }

  if (lower.includes("network") || lower.includes("unable to reach")) {
    return {
      title: "Connection issue",
      description:
        "The app could not reach the AI service. Check your connection and try again.",
    };
  }

  return {
    title: "Request failed",
    description: trimmed || "Something went wrong while generating this response.",
  };
}

function GracefulState({
  title,
  description,
  pending = false,
}: {
  title: string;
  description: string;
  pending?: boolean;
}) {
  return (
    <div className="h-full grid place-items-center px-5">
      <div className="max-w-sm rounded-xl border border-dashed border-input/70 bg-background/45 px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          <p className="text-sm font-medium text-foreground/90">{title}</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const isMockMode = searchParams.get('mock') === 'true';

  const {
    setHasWorkspace,
    setHasPreview,
    setDeployAction,
  } = useBuilderWorkspace();

  const [isMockReady, setIsMockReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsStatus, setModelsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [isReasoningPhase, setIsReasoningPhase] = useState(false);
  const [websiteId] = useState(() => createWebsiteId());
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployError, setDeployError] = useState<string | null>(null);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isDeployLinkCopied, setIsDeployLinkCopied] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>("chat");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("code");
  const [mobilePanel, setMobilePanel] = useState<"left" | "right">("left");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (isMockMode && !isMockReady) {
      setIsMockReady(true);
      setConversation(MOCK_CONVERSATION);
      setPreviewHtml(MOCK_HTML);
      setHasWorkspace(true);
      setHasPreview(true);
      setWorkspaceView("preview");
    }
  }, [isMockMode, isMockReady, setHasWorkspace, setHasPreview]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    return () => {
      uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [uploadedImages]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setModelsStatus("loading");
    setModelsError(null);

    fetchModels(controller.signal)
      .then((data) => {
        if (!active) return;
        setModels(data);
        setSelectedModel((prev) => {
          if (prev && data.some((model) => model.id === prev)) return prev;
          return data[0]?.id ?? "";
        });
        setModelsStatus("idle");
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setModelsStatus("error");
        setModelsError(
          error instanceof Error ? error.message : "Failed to load models."
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      alert("File type not supported. Please upload an image file.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("File too large. Maximum size is 10MB.");
      return false;
    }
    return true;
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          id: Math.random().toString(36).substring(7),
          file,
          preview,
        });
      }
    });

    if (newImages.length > 0) {
      setUploadedImages((prev) => [...prev, ...newImages]);
      posthog.capture("image_uploaded", { image_count: newImages.length });
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        imageFiles.forEach((file) => dataTransfer.items.add(file));
        handleFileUpload(dataTransfer.files);
      }
    },
    [handleFileUpload]
  );

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const sendPrompt = useCallback(
    async (prompt: string) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt || !selectedModel || isStreaming) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++requestIdRef.current;

      posthog.capture("website_generation_started", {
        model: selectedModel,
        is_update: Boolean(previewHtml),
      });
      setRequestError(null);
      setIsStreaming(true);
      setStreamingText("");
      setStreamingReasoning("");
      setIsReasoningPhase(false);
      setWorkspaceView("code");
      setConversation((prev) => [
        ...prev,
        createConversationMessage("user", trimmedPrompt),
      ]);

      let assistantOutput = "";
      let reasoningOutput = "";

      try {
        await streamChat(
          {
            model: selectedModel,
            input: buildWebsitePrompt(trimmedPrompt, previewHtml),
            stream: true,
          },
          {
            onToken: (token) => {
              if (!token) return;
              if (requestIdRef.current !== requestId) return;
              if (!assistantOutput) setIsReasoningPhase(false);
              assistantOutput += token;
              setStreamingText((prev) => prev + token);
            },
            onReasoningToken: (token) => {
              if (!token) return;
              if (requestIdRef.current !== requestId) return;
              if (!reasoningOutput) setIsReasoningPhase(true);
              reasoningOutput += token;
              setStreamingReasoning((prev) => prev + token);
            },
            onError: (message) => {
              if (requestIdRef.current !== requestId) return;
              posthog.capture("generation_error", { model: selectedModel, error_message: message });
              setRequestError(message);
            },
          },
          controller.signal
        );

        if (requestIdRef.current !== requestId) return;

        const html = extractHtmlDocument(assistantOutput);
        if (html) {
          posthog.capture("website_generated", {
            model: selectedModel,
            is_update: Boolean(previewHtml),
            has_reasoning: Boolean(reasoningOutput),
          });
          setPreviewHtml(html);
          setWorkspaceView("preview");
          setConversation((prev) => [
            ...prev,
            createConversationMessage(
              "assistant",
              "Applied changes to the live HTML/CSS preview. Describe next edits and I will update it.",
              reasoningOutput || undefined
            ),
          ]);
          return;
        }

        setConversation((prev) => [
          ...prev,
          createConversationMessage(
            "assistant",
            assistantOutput.trim() || "No response received from the model.",
            reasoningOutput || undefined
          ),
        ]);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestId) return;
        const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
        posthog.capture("generation_error", { model: selectedModel, error_message: errorMessage });
        posthog.captureException(error instanceof Error ? error : new Error(errorMessage));
        setRequestError(errorMessage);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsStreaming(false);
          setStreamingText("");
          setStreamingReasoning("");
          setIsReasoningPhase(false);
        }
      }
    },
    [isStreaming, previewHtml, selectedModel]
  );

  const handleSubmit = useCallback(() => {
    const prompt = inputValue.trim();
    if (!prompt) return;
    setInputValue("");
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    void sendPrompt(prompt);
  }, [inputValue, sendPrompt, uploadedImages]);

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      if (isStreaming) return;
      posthog.capture("suggestion_clicked", { suggestion_id: suggestion.id, suggestion_label: suggestion.label });
      setInputValue(suggestion.prompt);
      textareaRef.current?.focus();
    },
    [isStreaming]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const canSubmit = Boolean(inputValue.trim()) && Boolean(selectedModel) && !isStreaming;
  const hasPreview = Boolean(previewHtml);
  const hasStreamingText = Boolean(streamingText.trim());
  const previewFrameSrcDoc = hasPreview ? previewHtml : "";

  const renderCodeOutput = () => {
    if (isStreaming) {
      if (!hasStreamingText && !hasPreview) {
        return (
          <GracefulState
            title="Code is still generating"
            description="Give it a moment. Fresh output will appear here automatically."
            pending
          />
        );
      }

      return (
        <MonacoEditor
          value={extractHtmlDocument(streamingText) || streamingText || previewHtml}
          language="html"
          className="h-full"
          autoScroll
        />
      );
    }

    if (hasPreview) {
      return (
        <MonacoEditor
          value={previewHtml}
          onChange={setPreviewHtml}
          language="html"
          className="h-full"
        />
      );
    }

    return (
      <GracefulState
        title="No code yet"
        description="Start with a prompt to generate HTML and see code output."
      />
    );
  };

  const hasWorkspace =
    hasPreview || conversation.length > 0 || isStreaming || Boolean(requestError);
  const requestErrorView = requestError ? formatRequestError(requestError) : null;
  const isInitialState =
    !isMockMode &&
    conversation.length === 0 &&
    !isStreaming &&
    !requestError &&
    !hasPreview;
  const showStarterSuggestions =
    !isMockMode &&
    !hasPreview &&
    conversation.length === 0 &&
    !isStreaming &&
    !requestError;
  const firstRowSuggestions = SUGGESTIONS.slice(0, 5);
  const secondRowSuggestions = SUGGESTIONS.slice(5);

  const handleDeployClick = useCallback(() => {
    if (!previewHtml || isDeploying) return;

    posthog.capture("deploy_clicked", { website_id: websiteId });
    setIsDeploying(true);
    setDeployError(null);
    setIsDeployLinkCopied(false);

    void captureThumbnail(previewHtml)
      .catch(() => undefined)
      .then((thumbnail) =>
        deployWebsite({
          id: websiteId,
          html: previewHtml,
          name: "website",
          thumbnail,
        })
      )
      .then((response) => {
        posthog.capture("deploy_succeeded", { website_id: websiteId, deploy_url: response.url });
        setDeployUrl(response.url);
        setIsDeployDialogOpen(true);
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : "Failed to deploy website.";
        posthog.capture("deploy_failed", { website_id: websiteId, error_message: errorMessage });
        setDeployUrl("");
        setDeployError(errorMessage);
        setIsDeployDialogOpen(true);
      })
      .finally(() => {
        setIsDeploying(false);
      });
  }, [isDeploying, previewHtml, websiteId]);

  const handleCopyDeployLink = useCallback(() => {
    if (!deployUrl) return;

    const copyWithFallback = async () => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(deployUrl);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = deployUrl;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!copied) {
        throw new Error("Unable to copy link.");
      }
    };

    void copyWithFallback()
      .then(() => {
        posthog.capture("deploy_link_copied", { website_id: websiteId, deploy_url: deployUrl });
        setIsDeployLinkCopied(true);
      })
      .catch((error) => {
        setDeployError(
          error instanceof Error ? error.message : "Unable to copy deploy link."
        );
      });
  }, [deployUrl, websiteId]);

  const handleOpenDeployedSite = useCallback(() => {
    if (!deployUrl) return;
    posthog.capture("deployed_site_opened", { website_id: websiteId, deploy_url: deployUrl });
    window.open(deployUrl, "_blank", "noopener,noreferrer");
  }, [deployUrl, websiteId]);

  const handleOpenFullPreview = useCallback(() => {
    if (!previewHtml) return;

    posthog.capture("full_preview_opened", { website_id: websiteId });
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!previewWindow) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }, [previewHtml, websiteId]);

  useEffect(() => {
    setHasWorkspace(hasWorkspace);
  }, [hasWorkspace, setHasWorkspace]);

  useEffect(() => {
    return () => {
      setHasWorkspace(false);
    };
  }, [setHasWorkspace]);

  useEffect(() => {
    setHasPreview(hasPreview);
  }, [hasPreview, setHasPreview]);

  useEffect(() => {
    return () => {
      setHasPreview(false);
    };
  }, [setHasPreview]);

  useEffect(() => {
    setDeployAction(hasPreview ? handleDeployClick : null);
  }, [hasPreview, handleDeployClick, setDeployAction]);

  useEffect(() => {
    return () => {
      setDeployAction(null);
    };
  }, [setDeployAction]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [
    leftPanelView,
    conversation,
    isStreaming,
    streamingText,
    streamingReasoning,
    requestError,
  ]);

  useEffect(() => {
    if (!isDeployLinkCopied) return;
    const timeoutId = window.setTimeout(() => {
      setIsDeployLinkCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDeployLinkCopied]);

  const renderInputSection = () => (
    <div className="pointer-events-auto w-full max-w-3xl">
      <div
        ref={containerRef}
        className={cn(
          "border-input bg-background/90 cursor-text rounded-3xl border p-0 pt-1 transition-colors",
          isDragging && "border-primary bg-primary/5"
        )}
        onClick={() => textareaRef.current?.focus()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5 px-2 sm:px-2.5">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-input"
              >
                <Image
                  src={image.preview}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-background/90 hover:bg-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={isDragging ? "Drop images here..." : "What do you want to build?"}
          className="min-h-[44px] w-full resize-none border-0 bg-transparent dark:bg-transparent text-base sm:text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-4 pt-3 pb-1"
          rows={1}
        />

        <div className="flex items-center justify-between mt-3 p-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePaperclipClick}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-input bg-background hover:bg-accent"
            >
              <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <ModelSelector
              models={models}
              modelsStatus={modelsStatus}
              modelsError={modelsError}
              selectedModel={selectedModel}
              onValueChange={(value) => {
                posthog.capture("model_changed", { model: value, previous_model: selectedModel });
                setSelectedModel(value);
              }}
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {inputValue.trim() && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setInputValue("")}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-input bg-background hover:bg-accent"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
            <Button
              size="icon"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showStarterSuggestions && (
        <div className="w-full mt-3 px-2 md:px-0">
          <div className="flex flex-wrap justify-center gap-2 md:flex-nowrap">
            {firstRowSuggestions.map((suggestion) => {
              const IconComponent = suggestion.icon;
              return (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  className="h-8 sm:h-9 rounded-full border border-input bg-background px-3 sm:px-4 hover:bg-accent text-xs sm:text-sm gap-1.5 sm:gap-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">{suggestion.label}</span>
                </Button>
              );
            })}
          </div>
          {secondRowSuggestions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {secondRowSuggestions.map((suggestion) => {
                const IconComponent = suggestion.icon;
                return (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    className="h-8 sm:h-9 rounded-full border border-input bg-background px-3 sm:px-4 hover:bg-accent text-xs sm:text-sm gap-1.5 sm:gap-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap">{suggestion.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isInitialState) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center px-3 sm:px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">
          Build what&apos;s on your mind
        </h1>
        {renderInputSection()}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 h-full w-full p-2 md:p-4">
        <div className="flex md:hidden items-center gap-1 rounded-lg bg-muted/80 p-1">
          <button
            onClick={() => setMobilePanel("left")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              mobilePanel === "left"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="size-3.5" />
            Chat
          </button>
          <button
            onClick={() => setMobilePanel("right")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              mobilePanel === "right"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        </div>

        <div className={cn(
          "w-full md:w-1/2 flex flex-col rounded-2xl border border-input bg-background/90 overflow-hidden",
          mobilePanel === "left" ? "flex-1 min-h-0" : "hidden md:flex"
        )}>
          <Tabs
            value={leftPanelView}
            onValueChange={(value) => setLeftPanelView(value as LeftPanelView)}
            className="flex-1 min-h-0 gap-0"
          >
            <div className="flex-shrink-0 border-b border-input p-4">
              <TabsList className="h-8 rounded-lg bg-muted/80 p-0.5">
                <TabsTrigger
                  value="chat"
                  className="h-full rounded-md px-2.5 text-xs font-semibold"
                >
                  <MessageSquare className="size-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="h-full rounded-md px-2.5 text-xs font-semibold"
                >
                  <Code2 className="size-3.5" />
                  Code
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContents mode="layout" className="flex-1 min-h-0">
              <TabsContent value="chat" className="h-full">
                <div
                  ref={chatScrollRef}
                  className="h-full overflow-y-auto p-4 space-y-3"
                >
                  {conversation.map((message) => (
                    <React.Fragment key={message.id}>
                      {message.role === "assistant" && message.reasoning && (
                        <ReasoningDisplay
                          reasoning={message.reasoning}
                          isStreaming={false}
                        />
                      )}
                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                          message.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                            : "mr-auto bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {message.content}
                      </div>
                    </React.Fragment>
                  ))}

                  {isStreaming && (
                    <>
                      {streamingReasoning && (
                        <ReasoningDisplay
                          reasoning={streamingReasoning}
                          isStreaming={isReasoningPhase}
                        />
                      )}
                      {!isReasoningPhase && (
                        <div className="relative max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap mr-auto bg-muted text-foreground">
                          Generating website...
                        </div>
                      )}
                    </>
                  )}

                  {requestErrorView && (
                    <div className="mr-auto max-w-[95%] rounded-2xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span>{requestErrorView.title}</span>
                      </div>
                      <p className="mt-1 pl-6 text-xs leading-5 text-muted-foreground">
                        {requestErrorView.description}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="code" className="h-full p-4">
                {renderCodeOutput()}
              </TabsContent>
            </TabsContents>
          </Tabs>
          <div className="p-3 border-t border-input">
            {renderInputSection()}
          </div>
        </div>

        <div className={cn(
          "w-full md:w-1/2 flex flex-col rounded-2xl border border-input bg-background/90 overflow-hidden p-4",
          mobilePanel === "right" ? "flex-1 min-h-0" : "hidden md:flex"
        )}>
          <Tabs
            value={workspaceView}
            onValueChange={(value) => setWorkspaceView(value as WorkspaceView)}
            className="h-full gap-4"
          >
            <div className="flex-shrink-0 border-b border-input pb-4 flex items-center justify-between gap-2">
              <TabsList className="h-8 rounded-lg bg-muted/80 p-0.5">
                <TabsTrigger
                  value="preview"
                  className="h-full rounded-md px-2.5 text-xs font-semibold"
                >
                  <Eye className="size-3.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="h-full rounded-md px-2.5 text-xs font-semibold"
                >
                  <Code2 className="size-3.5" />
                  Code
                </TabsTrigger>
              </TabsList>
              {hasPreview && (
                <div className="flex items-center gap-2">
                  <span className="hidden lg:inline-flex rounded-md border border-input bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {websiteId}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeployClick}
                    disabled={isDeploying}
                    className="h-8 rounded-md text-xs"
                  >
                    {isDeploying ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Rocket className="size-3.5" />
                    )}
                    {isDeploying ? "Deploying..." : "Deploy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenFullPreview}
                    className="h-8 rounded-md text-xs"
                  >
                    <ExternalLink className="size-3.5" />
                    Full Preview
                  </Button>
                </div>
              )}
            </div>

            <TabsContents mode="layout" className="flex-1 min-h-0">
              <TabsContent value="preview" className="h-full">
                {isStreaming ? (
                  <GracefulState
                    title="Preview will appear here"
                    description="Generation is in progress. You can follow code updates while we finish."
                    pending
                  />
                ) : hasPreview ? (
                  <iframe
                    title="Website preview"
                    srcDoc={previewFrameSrcDoc}
                    className="h-full w-full rounded-xl border border-input bg-white"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  />
                ) : (
                  <GracefulState
                    title="No preview yet"
                    description="Generate a website first, then preview will appear here."
                  />
                )}
              </TabsContent>

              <TabsContent value="code" className="h-full">
                {renderCodeOutput()}
              </TabsContent>
            </TabsContents>
          </Tabs>
        </div>
      </div>

      <DeployDialog
        open={isDeployDialogOpen}
        onClose={() => setIsDeployDialogOpen(false)}
        websiteId={websiteId}
        deployUrl={deployUrl}
        deployError={deployError}
        isDeployLinkCopied={isDeployLinkCopied}
        onCopyLink={handleCopyDeployLink}
        onOpenSite={handleOpenDeployedSite}
      />
    </>
  );
}
