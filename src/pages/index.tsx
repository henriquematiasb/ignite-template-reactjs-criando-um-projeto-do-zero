import { useState } from 'react';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import Container from '../components/Container';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPosts, setNextPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  function formatDate(date: string): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  async function handleSeeMore(): Promise<void> {
    try {
      const response = await fetch(nextPage);
      const data = await response.json();

      setNextPage(data.next_page);

      const posts: Post[] = data.results.map(
        post =>
          ({
            uid: post.uid,
            data: {
              author: post.data.author,
              title: post.data.title,
              subtitle: post.data.subtitle,
            },
            first_publication_date: post.first_publication_date,
          } as Post)
      );

      setNextPosts(prevState => [...prevState, ...posts]);
    } catch (err) {
      throw new Error(err);
    }
  }

  return (
    <Container>
      <Head>
        <title>Posts | Spacetraveling</title>
      </Head>
      <Header />

      <div className={styles.posts}>
        {nextPosts.map(item => (
          <a key={item.uid}>
            <Link href={`/post/${item.uid}`}>
              <strong>{item.data.title}</strong>
            </Link>
            <p>{item.data.subtitle}</p>
            <div>
              <span>
                <FiCalendar color="#BBBBBB" size={20} />
                {formatDate(item.first_publication_date)}
              </span>
              <span>
                <FiUser color="#BBBBBB" size={20} />
                {item.data.author}
              </span>
            </div>
          </a>
        ))}
      </div>

      {nextPage && (
        <button
          type="button"
          onClick={handleSeeMore}
          className={styles.loadMoreButton}
        >
          Carregar mais posts
        </button>
      )}
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'po')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
