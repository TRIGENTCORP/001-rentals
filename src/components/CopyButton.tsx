import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  copyMessage?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = "",
  size = "sm",
  variant = "outline",
  showText = false,
  copyMessage = "Copied to clipboard!"
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Success",
        description: copyMessage,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleCopy}
      size={size}
      variant={variant}
      className={`${className} ${copied ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}`}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {showText && (
        <span className="ml-2">
          {copied ? "Copied!" : "Copy"}
        </span>
      )}
    </Button>
  );
};

export default CopyButton;



