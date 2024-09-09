/** @type {import('next').NextConfig} */
const nextConfig = {
    output:"standalone",
    env:{
        API_URL:"http://localhost:3000",
        DB_URI:"mongodb+srv://kaleabnew21:kaleab1221@mart.tywhp.mongodb.net/?retryWrites=true&w=majority&appName=Mart"
    },
    images:{
        domains:['res.cloudinary.com']
    }
};

export default nextConfig;
