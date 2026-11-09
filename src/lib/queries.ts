import { queryOptions } from '@tanstack/react-query';
import { api } from './api';

export const libraryQuery = queryOptions({ queryKey: ['library'], queryFn: () => api.listCreators() });
export const historyQuery = queryOptions({ queryKey: ['history'], queryFn: () => api.listHistory(0) });
export const videoQuery = (id: string) => queryOptions({ queryKey: ['video', id], queryFn: () => api.getVideo(id), staleTime: 0 });
export const archiveQuery = (id: string) => queryOptions({
  queryKey: ['archive', id],
  queryFn: async () => {
    const [creator, motifs, videos, claims, clusters] = await Promise.all([
      api.getCreator(id), api.listMotifs(id), api.listVideos(id, 0), api.listClaimsByVideo(id, 0), api.listClusters(id, 0, 'repeat'),
    ]);
    return { creator, motifs, videos, claims, clusters };
  },
});