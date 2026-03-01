import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export function SEO({
    title = "ManagerX - Discord Bot",
    description = "ManagerX - Moderation, Levelsystem, Globalchat und mehr für deinen Discord Server",
    image = "https://managerx.bot/logo.png", // Ensure absolute URL for social images
    url = "https://managerx.bot",
    type = "website"
}: SEOProps) {
    const fullTitle = title === "ManagerX - Discord Bot" ? title : `${title} | ManagerX`;

    return (
        <Helmet>
            {/* Search Engine */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="image" content={image} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
