import { ProjectPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        Nickita Khylkouski
      </h1>
      <p className="mb-4">
        {`I'm a creator and problem solver who thrives on pushing boundaries. From dismantling toys as a kid to building AI systems today, I'm driven by curiosity about how things work. My passion spans artificial intelligence, machine learning, and software development.`}
      </p>
      <p className="mb-4">
        {`Beyond coding, fitness keeps me grounded. Strength training and time in the sauna help me reflect, reset, and set new goals—whether in tech, academics, or personal growth.`}
      </p>
      <div className="my-8">
        <ProjectPosts />
      </div>
    </section>
  )
}
