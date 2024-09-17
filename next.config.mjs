/** @type {import('next').NextConfig} */
const nextConfig = {

    env: {
        API_URL: "https://wagamart.azurewebsites.net/",
        DB_URI: "mongodb://wagadb:E4ioEaEnRfY1FgJ9uLWefww5HF3IRftijqNYpkCZkz2PCXIbznGNZecpy299FHSGyjR3WouvoEUgACDbPfNlrw==@wagadb.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@wagadb@"
    },
    images: {
        domains: ['res.cloudinary.com']
    }
};

export default nextConfig;
