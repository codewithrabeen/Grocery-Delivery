import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';



const auth = (req: Request, res: Response, next: NextFunction) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;


    req.user = { id: decoded.id }; // Attach user info to request object for later use
    next();

  } catch (error) {
    console.error('Authentication error:', error);

    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default auth;
