import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as dotenv from "dotenv";
dotenv.config();

const corsOptions = {
  origin: "http://127.0.0.1:5173",
  // origin: process.env.CORS_ORIGIN,
};

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "ngcash2022";

const routes = express();
routes.use(express.json());
routes.use(express.urlencoded({ extended: true }));
routes.use(cors());

routes.get("/", cors(corsOptions), async (req: Request, res: Response) => {
  res.json({ message: "Tudo okay por aqui!" });
});

routes.post("/", cors(corsOptions), async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const saltRounds = 10;
  const hashPassword = bcrypt.hashSync(password, saltRounds);
  const user = await prisma.users.create({
    data: {
      username: username,
      password: hashPassword,
      account: {
        create: {
          balance: "R$ 100,00",
        },
      },
    },
    include: {
      account: true,
    },
  });
  res.json(user);
});

function verifyJWT(req: Request, res: Response, next: any) {
  const token = req.headers.authorization;
  jwt.verify(<any>token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).end();

    req.body.userId = (<any>decoded).userId;
    next();
  });
}

// routes.get(
//   "/transactions",
//   verifyJWT,
//   async (req: Request, res: Response) => {}
// );

routes.get(
  "/teste",
  cors(corsOptions),
  verifyJWT,
  async (req: Request, res: Response) => {
    res.send("Tudo ok");
  }
);

routes.post(
  "/login",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({
      where: {
        username: username,
      },
    });
    const hashPassword = user?.password || "null";
    const comparisonResult = bcrypt.compareSync(password, hashPassword);
    if (comparisonResult) {
      const token = jwt.sign({ userId: user?.id }, JWT_SECRET, {
        expiresIn: 86400,
      });
      return res.json({ auth: true, token });
    }
    res.status(401).end();
  }
);

routes.post(
  "/logout",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    res.end();
  }
);

routes.get(
  "/byUsername/:username",
  cors(corsOptions),
  async (req: Request, res: Response) => {
    const username = req.params.username;
    const user = await prisma.users.findUnique({
      where: {
        username: username,
      },
    });
    res.json(user);
  }
);

routes.get("/byId/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await prisma.users.findUnique({
    where: {
      id: Number(id),
    },
  });
  res.json(user);
});

routes.put("/", async (req: Request, res: Response) => {
  const { id, username } = req.body;
  const updatedUser = await prisma.users.update({
    where: {
      id: id,
    },
    data: {
      username: username,
    },
  });
  res.json(updatedUser);
});

routes.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const deletedUser = await prisma.users.delete({
    where: {
      id: Number(id),
    },
  });
  res.json(deletedUser);
});

export default routes;
