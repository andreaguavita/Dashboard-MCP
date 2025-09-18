'use client';

import React, {
  useEffect,
  useRef,
  useActionState,
  useState,
} from 'react';
import Image from 'next/image';
import {
  ImageIcon,
  Loader2,
  Sparkles,
  Send,
  Wand2,
  Clipboard,
} from 'lucide-react';
import {AgentCard} from './AgentCard';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {Label} from './ui/label';
import {Input} from './ui/input';
import {useToast} from '@/hooks/use-toast';
import {
  generateImageAction,
  generateSmartPromptsAction,
} from '@/lib/actions/image';
import type {ActionState} from '@/lib/definitions';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import {Separator} from './ui/separator';

const initialState: ActionState<{src: string; name: string}> = {
  message: '',
};

const initialPromptsState: ActionState<string[]> = {
  message: '',
};

function GenerateButton({isPending}: {isPending: boolean}) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      aria-disabled={isPending}
      className="w-full sm:w-auto"
      aria-live="polite"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Send />}
      <span className="ml-2">{isPending ? 'Generating...' : 'Generate'}</span>
    </Button>
  );
}

function SuggestButton({isPending}: {isPending: boolean}) {
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-disabled={isPending}
      aria-live="polite"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
      <span className="ml-2">{isPending ? 'Thinking...' : 'Suggest'}</span>
    </Button>
  );
}

export function ImageAgentCard() {
  const {toast} = useToast();
  const [imageState, formAction, isImagePending] = useActionState(
    generateImageAction,
    initialState
  );
  const [promptsState, promptsAction, isPromptsPending] = useActionState(
    generateSmartPromptsAction,
    initialPromptsState
  );

  const formRef = useRef<HTMLFormElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const placeholderImage = PlaceHolderImages.find(
    p => p.id === 'image-agent-placeholder'
  );

  const [displayedImage, setDisplayedImage] = useState<{src: string; alt: string}>(
    {
      src: placeholderImage?.imageUrl || 'https://picsum.photos/512/512',
      alt: 'Generated image placeholder',
    }
  );

  useEffect(() => {
    if (isImagePending) {
       setDisplayedImage({
        src: 'https://picsum.photos/seed/loading/512/512',
        alt: 'Loading image...',
      });
    }
  }, [isImagePending]);

  useEffect(() => {
    if (imageState.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: imageState.message,
      });
      // Revert to placeholder if generation fails
      if(placeholderImage?.imageUrl) {
        setDisplayedImage({
          src: placeholderImage.imageUrl,
          alt: 'Generated image placeholder',
        });
      }
    } else if (imageState.data?.src) {
      setDisplayedImage({
        src: imageState.data.src,
        alt: imageState.data.name,
      });
    }
  }, [imageState, toast, placeholderImage]);

  useEffect(() => {
    if (promptsState.message && promptsState.error) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: promptsState.message,
      });
    }
  }, [promptsState, toast]);

  const handlePromptClick = (prompt: string) => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.value = prompt;
      toast({
        title: 'Prompt Copied!',
        description: 'The suggested prompt has been copied to the textarea.',
      });
    }
  };

  return (
    <AgentCard
      title="Image Agent (n8n)"
      description="Generate an image from a text prompt using an n8n workflow."
      icon={ImageIcon}
    >
      <div
        className="flex-grow flex flex-col justify-center items-center p-4 border-2 border-dashed rounded-lg bg-secondary/50"
        aria-busy={isImagePending}
        aria-live="polite"
      >
        <Image
          src={displayedImage.src}
          alt={displayedImage.alt}
          width={512}
          height={512}
          className="rounded-lg object-cover aspect-square max-w-full h-auto max-h-[400px] shadow-md"
          data-ai-hint={placeholderImage?.imageHint}
          priority
          unoptimized={displayedImage.src.startsWith('data:')}
        />
      </div>

      <form
        ref={formRef}
        action={formAction}
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
            <p className="text-sm text-destructive mt-1">
              {imageState.fieldErrors.prompt}
            </p>
          )}
        </div>
        <div className="text-right">
          <GenerateButton isPending={isImagePending} />
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
            <Label htmlFor="topic" className="sr-only">
              Topic
            </Label>
            <Input id="topic" name="topic" placeholder="Enter a topic, e.g., 'space'" />
          </div>
          <SuggestButton isPending={isPromptsPending} />
        </form>
        {promptsState.fieldErrors?.topic && (
          <p className="text-sm text-destructive mt-1">
            {promptsState.fieldErrors.topic}
          </p>
        )}
        {promptsState.data && (
          <div className="space-y-2 pt-2">
            {promptsState.data.map((prompt, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 text-sm"
              >
                <span className="italic">"{prompt}"</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePromptClick(prompt)}
                  aria-label="Copy prompt"
                >
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
