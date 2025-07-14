import Loading from './components/ui/loading'

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <Loading 
        size="xl" 
        text="Loading your experience..." 
        className="text-center"
      />
    </div>
  )
}
