import { useParams } from 'react-router';
import { EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { CardPost } from '@/components/comunidade/CardPost';
import { ehNaoEncontrado } from '@/lib/api';
import { chaveDoPost } from '@/lib/comunidade';
import { usePost } from '@/lib/queries';

export function PostPage() {
  const { id = '' } = useParams();
  const post = usePost(id);
  return (
    <div className="pb-10">
      <PageHeader title="Post" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {post.isLoading ? (
          <Spinner />
        ) : post.isError ? (
          ehNaoEncontrado(post.error) ? (
            <EmptyState title="Este post não existe mais" text="Ele pode ter sido apagado ou ficado privado." />
          ) : (
            <ErrorState text="Não foi possível carregar o post." erro={post.error} onRetry={() => post.refetch()} />
          )
        ) : (
          post.data && <CardPost key={chaveDoPost(post.data)} post={post.data} />
        )}
      </div>
    </div>
  );
}
