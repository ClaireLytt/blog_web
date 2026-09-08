import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ id }) => id.startsWith('zh/'))).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'Yantong Li — 技术博客',
    description: '一个关于编程与技术的个人博客。',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/zh/blog/${post.id.slice(3)}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
