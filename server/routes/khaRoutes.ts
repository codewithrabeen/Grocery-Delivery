import { Router } from "express";

const router = Router();

router.post("/initiate", (req, res) => {
  res.json({ message: "Initiate payment endpoint works" });
});

router.post("/verify", (req, res) => {
  res.json({ message: "Verify payment endpoint works" });
});

export default router;