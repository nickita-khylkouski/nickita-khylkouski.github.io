export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">My Blog</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        No blogs yet.
      </p>
    </section>
  )
} 