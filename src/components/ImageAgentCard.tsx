"use client";

import React, { startTransition, useEffect, useOptimistic, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import {
  ImageIcon,
  Loader2,
  Sparkles,
  Send,
  Wand2,
  Clipboard,
} from "lucide-react";
import { AgentCard } from "./AgentCard";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  generateImageAction,
  generateSmartPromptsAction,
} from "@/lib/actions/image";
import type { ActionState, N8NImageResult } from "@/lib/definitions";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

const initialState: ActionState<N8NImageResult> = {
  message: "",
};

const initialPromptsState: ActionState<string[]> = {
  message: "",
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Send />
      )}
      <span className="ml-2">{pending ? "Generating..." : "Generate"}</span>
    </Button>
  );
}

function SuggestButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Wand2 />
      )}
      <span className="ml-2">{pending ? "Thinking..." : "Suggest"}</span>
    </Button>
  );
}

export function ImageAgentCard() {
  const { toast } = useToast();
  const [imageState, formAction] = useFormState(generateImageAction, initialState);
  const [promptsState, promptsAction] = useFormState(generateSmartPromptsAction, initialPromptsState);

  const formRef = useRef<HTMLFormElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholderImage = PlaceHolderImages.find(p => p.id === 'image-agent-placeholder');
  const [optimisticImage, setOptimisticImage] = useOptimistic(
    imageState.data?.image_url,
    (state, newImage: string) => newImage
  );

  useEffect(() => {
    if (imageState.message && imageState.error) {
      toast({ variant: "destructive", title: "Generation Failed", description: imageState.message });
    }
  }, [imageState, toast]);
  
  useEffect(() => {
    if (promptsState.message && promptsState.error) {
      toast({ variant: "destructive", title: "Suggestion Failed", description: promptsState.message });
    }
  }, [promptsState, toast]);

  const handlePromptClick = (prompt: string) => {
    if (promptTextareaRef.current) {
        promptTextareaRef.current.value = prompt;
        toast({ title: "Prompt Copied!", description: "The suggested prompt has been copied to the textarea." });
    }
  };

  return (
    <AgentCard
      title="Image Agent (n8n)"
      description="Generate an image from a text prompt using an n8n workflow."
      icon={ImageIcon}
    >
      <div className="flex-grow flex flex-col justify-center items-center p-4 border-2 border-dashed rounded-lg bg-secondary/50">
        <Image
          src={optimisticImage || placeholderImage?.imageUrl || "https://picsum.photos/512/512"}
          alt={imageState.data?.image_url ? "Generated image" : "Placeholder image"}
          width={512}
          height={512}
          className="rounded-lg object-cover aspect-square max-w-full h-auto max-h-[400px] shadow-md"
          data-ai-hint={placeholderImage?.imageHint}
          priority
        />
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          startTransition(() => setOptimisticImage("https://picsum.photos/seed/loading/512/512"));
          formAction(formData);
        }}
        className="mt-4 space-y-4"
      >
        <div>
          <Label htmlFor="prompt">Your Image Prompt</Label>
          <Textarea
            id="prompt"
            name="prompt"
            ref={promptTextareaRef}
            placeholder="e.g., A vibrant city skyline at dusk, synthwave style"
            required
            className="mt-1"
            rows={3}
          />
          {imageState.fieldErrors?.prompt && (
            <p className="text-sm text-destructive mt-1">{imageState.fieldErrors.prompt}</p>
          )}
        </div>
        <div className="text-right">
          <GenerateButton />
        </div>
      </form>
      
      <Separator className="my-6" />

      <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            <h3 className="font-headline text-lg">Need inspiration?</h3>
          </div>
          <form action={promptsAction} className="flex gap-2">
            <div className="flex-grow">
              <Label htmlFor="topic" className="sr-only">Topic</Label>
              <Input id="topic" name="topic" placeholder="Enter a topic, e.g., 'space'" />
            </div>
            <SuggestButton />
          </form>
          {promptsState.fieldErrors?.topic && (
            <p className="text-sm text-destructive mt-1">{promptsState.fieldErrors.topic}</p>
          )}
          {promptsState.data && (
            <div className="space-y-2 pt-2">
                {promptsState.data.map((prompt, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 text-sm">
                        <span className="italic">"{prompt}"</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handlePromptClick(prompt)} aria-label="Copy prompt">
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
          )}
      </div>

    </AgentCard>
  );
}
