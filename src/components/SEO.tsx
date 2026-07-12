import { Helmet } from "react-helmet-async";

const BASE_URL = "https://fintrackplus.com";

type JsonLdSchema = Record<string, unknown>;

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: JsonLdSchema | JsonLdSchema[];
}

export const SEO = ({ title, description, path, jsonLd }: SEOProps) => {
  const url = `${BASE_URL}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
