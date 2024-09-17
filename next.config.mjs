/** @type {import('next').NextConfig} */
const nextConfig = {

    env: {
        API_URL: "https://wagamart.azurewebsites.net/",
        DB_URI: process.env.DB_URI
    },
    images: {
        domains: ['res.cloudinary.com']
    }
};

export default nextConfig;
