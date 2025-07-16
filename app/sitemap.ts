import { getProjectPosts } from 'app/projects/utils'

export const baseUrl = 'https://nickitakhy.me'

export const dynamic = 'force-static'

export default async function sitemap() {
  let routes = ['', '/blog', '/projects'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return routes
}
