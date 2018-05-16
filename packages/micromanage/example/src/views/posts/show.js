import React from 'react'
import { Connect } from 'microcosm-dom'
import { Comments } from '../comments/show'
import TimeAgo from 'react-timeago'

function Article({ post }) {
  return (
    <article className="post">
      <header>
        <h1>{post.title}</h1>
      </header>

      <p>{post.body}</p>

      <footer>
        <p>
          <i>
            Last requested <TimeAgo date={post._age} /> seconds ago
          </i>
        </p>
      </footer>
    </article>
  )
}

export function PostsShow({ match }) {
  const { id } = match.params

  return (
    <main>
      <Connect source="posts.find" params={{ id }}>
        {({ data }) => {
          if (data == null) {
            return <p>Loading...</p>
          }

          return <Article post={data} />
        }}
      </Connect>
      <Comments post={id} />
    </main>
  )
}