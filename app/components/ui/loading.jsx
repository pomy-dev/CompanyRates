import { cn } from "@/lib/utils"
import { Loader2, RefreshCw } from "lucide-react"

const Loading = ({ 
  variant = "default", 
  size = "md", 
  className,
  text = "Loading...",
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  }

  const LoadingIcon = variant === "refresh" ? RefreshCw : Loader2

  const loadingContent = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      <LoadingIcon className={cn(
        "animate-spin text-blue-600",
        sizeClasses[size]
      )} />
      {text && (
        <p className={cn(
          "text-slate-600 font-medium",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 border">
          {loadingContent}
        </div>
      </div>
    )
  }

  return loadingContent
}

export default Loading
