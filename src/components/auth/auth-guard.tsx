import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '@/shared/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { session, role, loading, isAllowed } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-sm space-y-3 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground">
            Your account ({session.user.email}) is not authorized to access
            this system. Contact the owner to get access.
          </p>
        </div>
      </div>
    )
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
