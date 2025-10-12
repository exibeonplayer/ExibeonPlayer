import { usePlaylistStats } from '@/hooks/usePlaylistStats';
import { Playlist } from '@/hooks/usePlaylists';
import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';

interface PlaylistStatsProps {
  playlist: Playlist;
}

const PlaylistStats = ({ playlist }: PlaylistStatsProps) => {
  const { stats, loading } = usePlaylistStats(playlist);

  if (loading) {
    return (
      <div className="flex gap-4">
        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Vídeos:</span>
        <span className="font-medium">{stats.totalVideos}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Duração:</span>
        <span className="font-medium">{stats.totalDuration}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Players:</span>
        <Badge variant="outline" className="text-xs">
          {stats.assignedPlayers}
        </Badge>
      </div>
    </div>
  );
};

export default PlaylistStats;
