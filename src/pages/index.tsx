import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';
import { PreviewToolbar } from '../components/PreviewToolbar';

import commonStyles from '../styles/common.module.scss';
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
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [postsList, setPostsList] = useState(postsPagination);

  function handleNextPage(url: string): void {
    fetch(url)
      .then(response => response.json())
      .then(data =>
        setPostsList({
          next_page: data.next_page,
          results: [...postsList.results, ...data.results],
        })
      );
  }

  return (
    <>
      <Head>
        <title>Beidragene | Bloggprosjekt</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.content}>
          <div>
            <ul className={styles.postsList}>
              {postsList.results.map(post => (
                <li key={post.uid} className={styles.post}>
                  <Link href={`/post/${post.uid}`}>
                    <a>
                      <h1 className={styles.title}>{post.data.title}</h1>
                      <p className={styles.subtitle}>{post.data.subtitle}</p>
                      <div className={styles.info}>
                        <div className={styles.infoContent}>
                          <FiCalendar size={20} color="#D7D7D7" />
                          <span>
                            {format(
                              new Date(post.first_publication_date),
                              'dd MMM uuuu',
                              {
                                locale: ptBR,
                              }
                            )}
                          </span>
                        </div>
                        <div className={styles.infoContent}>
                          <FiUser size={20} color="#D7D7D7" />
                          <span>{post.data.author}</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
            {postsList.next_page && (
              <button
                onClick={() => handleNextPage(postsList.next_page)}
                type="button"
                className={commonStyles.morePosts}
              >
                Carregar mais posts
              </button>
            )}
          </div>
        </div>
      </main>
      {preview && (
        <Link href="api/exit-preview">
          <a className={commonStyles.preview}>Avslutt forhåndsvisningsmodus</a>
        </Link>
      )}
      <PreviewToolbar />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData = {},
}) => {
  const { ref } = previewData;
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.first_publication_date',
        'post.title',
        'post.subtitle',
        'post.banner',
        'post.author',
        'post.content',
      ],
      pageSize: 2,
      orderings: '[document.first_publication_date',
      ref: ref || null,
    }
  );

  const { next_page } = postsResponse;

  const results: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
        banner: post.data.banner,
      },
    };
  });

  const postsPagination = {
    results,
    next_page,
  };

  return {
    props: { postsPagination, preview },
  };
};
