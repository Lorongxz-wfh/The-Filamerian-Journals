import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

export const Seo: React.FC<SeoProps> = ({ title, description, url, image, type = 'website' }) => {
  const defaultTitle = 'The Filamerian Journals';
  const defaultDescription = 'Official online database of published journals, theses, case studies, and research papers from Filamer Christian University.';
  const defaultUrl = window.location.origin;
  const defaultImage = `${window.location.origin}/og-image.png`;

  return (
    <Helmet>
      <title>{title ? `${title} | ${defaultTitle}` : defaultTitle}</title>
      <meta name="description" content={description ?? defaultDescription} />
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ?? defaultTitle} />
      <meta property="og:description" content={description ?? defaultDescription} />
      <meta property="og:url" content={url ?? defaultUrl} />
      <meta property="og:image" content={image ?? defaultImage} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ?? defaultTitle} />
      <meta name="twitter:description" content={description ?? defaultDescription} />
      <meta name="twitter:image" content={image ?? defaultImage} />
    </Helmet>
  );
};
