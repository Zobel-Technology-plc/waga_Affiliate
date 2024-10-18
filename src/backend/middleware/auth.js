// /backend/middleware/auth.js
import { getSession } from 'next-auth/react';

export const protectRoute = async (req, res, next) => {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized, please log in' });
  }
  next();
};
