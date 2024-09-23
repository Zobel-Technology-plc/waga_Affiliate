import dbConnect from '../../../backend/config/dbConnect';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { userId } = req.body;

    // Add logging to check the received userId
    console.log('Received userId:', userId);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const inviteLink = `https://t.me/Waga_affiliate_bot?start=${userId}`;

    res.status(201).json({ success: true, inviteLink });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
