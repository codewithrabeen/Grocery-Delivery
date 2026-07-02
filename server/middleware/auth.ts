import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';



const auth = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const userId = typeof decoded.id === 'string' ? decoded.id : '';

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = { id: user.id, isAdmin: user.role === 'ADMIN' };
    next();

  } catch (error) {
    console.error('Authentication error:', error);

    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default auth;
