function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
        {`When I'm not coding, I hit the gym and sauna to stay healthy. It helps me reflect, reset, and set new goals, whether in tech, academics, or personal growth.`}
      </p>
      
      <ul className="font-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-600 md:flex-row md:space-x-4 md:space-y-0 dark:text-neutral-300">
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/nickita-khylkouski"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">github</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://x.com/nlck_bits"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">x</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://www.linkedin.com/in/nickita-khy"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">linkedin</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href="https://devpost.com/nickitakhy"
          >
            <ArrowIcon />
            <p className="ml-2 h-7">devpost</p>
          </a>
        </li>
      </ul>
    </section>
  )
}
