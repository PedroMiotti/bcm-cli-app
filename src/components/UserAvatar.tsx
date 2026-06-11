"use client"

interface UserAvatarProps {
  displayName: string
  description?: string
  size?: "sm" | "md"
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function UserAvatar({ displayName, description, size = "md" }: UserAvatarProps) {
  const initials = getInitials(displayName)
  const firstName = displayName.split(" ")[0]

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block min-w-0">
          <p className="text-xs font-semibold text-foreground/80 truncate leading-tight">{firstName}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{description}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-black text-primary shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate leading-tight">{displayName}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground truncate leading-tight">{description}</p>
        )}
      </div>
    </div>
  )
}
