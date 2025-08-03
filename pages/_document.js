import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Tailwind CSS removed from CDN - will be installed as PostCSS plugin */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}