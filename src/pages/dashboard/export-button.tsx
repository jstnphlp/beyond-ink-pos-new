import { Button } from '@/components/ui/button'
import { useExportDashboard } from '@/shared/hooks/use-export'
import { Download } from 'lucide-react'

export function ExportButton() {
  const exportMutation = useExportDashboard()

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => exportMutation.mutate()}
      disabled={exportMutation.isPending}
    >
      <Download className="h-3.5 w-3.5" />
      {exportMutation.isPending ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}
