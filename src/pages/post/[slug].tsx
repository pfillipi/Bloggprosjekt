import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import { Comments } from '../../components/Comments';
import { PreviewToolbar } from '../../components/PreviewToolbar';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  href: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost?: Post;
  prevPost?: Post;
  preview: boolean;
}

export default function Publication({
  post,
  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <Head>
        <title>{publication.data.title} | Bloggprosjekt</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={publication.data.banner.url} alt="Post" />
      </div>
      <main className={commonStyles.container}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={styles.info}>
          <div>
            <FiCalendar size={20} color="#D7D7D7" />
            <span>{publication.first_publication_date}</span>
          </div>
          <div>
            <FiUser size={20} color="#D7D7D7" />
            <span>{publication.data.author}</span>
          </div>
          <div>
            <FiClock size={20} color="#D7D7D7" />
            <span>
              {Math.ceil(
                post.data.content.reduce((totalContent, item) => {
                  return (
                    totalContent +
                    item.body.reduce((total, paragraph) => {
                      return total + paragraph.text.split(' ').length;
                    }, 0)
                  );
                }, 0) / 200
              )}{' '}
              min
            </span>
          </div>
        </div>
        <p>* bearbeitet am {post.last_publication_date}</p>
        {post.data.content.map(content => (
          <div
            key={`${content.heading}, ${Date.now()}`}
            className={styles.content}
          >
            <h2 className={styles.heading}>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
        <hr />
      </main>
      <div className={styles.navigation}>
        {prevPost && (
          <Link href={`/post/${prevPost.uid}`}>
            <a className={styles.previous}>
              {prevPost.data.title}
              <h3>Forrige innlegg</h3>
            </a>
          </Link>
        )}
        {nextPost && (
          <Link href={`/post/${nextPost.uid}`}>
            <a className={styles.next}>
              {nextPost.data.title}
              <h3>Neste innlegg</h3>
            </a>
          </Link>
        )}
      </div>
      <Comments />
      {preview && (
        <Link href="/api/exit-preview">
          <a className={commonStyles.preview}>Avslutt forhåndsvisningsmodus.</a>
        </Link>
      )}
      <PreviewToolbar />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.uid',
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
      pageSize: 20,
    }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: { slug: post.uid },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  const { slug } = params;
  const { ref } = previewData;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {
    ref: ref || null,
  });

  const nextPost = await prismic.query(
    [
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
    }
  );

  const prevPost = await prismic.query(
    [
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
    ],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    href: response.href,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM uuuu',
      { locale: ptBR }
    ),
    last_publication_date: format(
      new Date(response.last_publication_date),
      "dd MMM uuuu 'às' H:m",
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      nextPost: nextPost.results[0] || null,
      prevPost: prevPost.results[0] || null,
      preview,
    },
  };
};
