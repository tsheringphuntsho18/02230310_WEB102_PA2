import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "jsonwebtoken";
import axios from "axios";
import { jwt } from "hono/jwt";
import bcrypt from "bcrypt";

const app = new Hono();
const prisma = new PrismaClient();

app.use("/*", cors());

app.use(
  "/protected/*",
  jwt({
    secret: "mySecretKey",
  })
);

// Authentication Endpoints
app.post("/register", async (c) => {
  const { email, password } = await c.req.json();

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, hashedPassword },
    });
    return c.json({ message: `${user.email} created successfully` });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return c.json({ message: "Email already exists" });
      }
    }
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, hashedPassword: true },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  const match = await bcrypt.compare(password, user.hashedPassword);

  if (match) {
    const token = sign(
      { sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
      "mySecretKey"
    );
    return c.json({ message: "Login successful", token });
  } else {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }
});

// Fetch Pokemon Data from PokeAPI
app.get("/pokemon/:name", async (c) => {
  const { name } = c.req.param();

  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    return c.json({ data: response.data });
  } catch (error) {
    return c.json({ message: "Pokemon not found" }, 404);
  }
});

// Protected User Resource Endpoints
app.post("/protected/catch", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const { name } = await c.req.json();

  let pokemon = await prisma.pokemon.findUnique({ where: { name } });

  if (!pokemon) {
    pokemon = await prisma.pokemon.create({ data: { name } });
  }

  const caughtPokemon = await prisma.caughtPokemon.create({
    data: { userId: payload.sub, pokemonId: pokemon.id },
  });

  return c.json({ message: "Pokemon caught", data: caughtPokemon });
});

app.delete("/protected/release/:id", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const { id } = c.req.param();

  await prisma.caughtPokemon.deleteMany({
    where: { id: Number(id), userId: payload.sub },
  });

  return c.json({ message: "Pokemon released" });
});

app.get("/protected/caught", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const caughtPokemon = await prisma.caughtPokemon.findMany({
    where: { userId: payload.sub },
    include: { pokemon: true },
  });

  return c.json({ data: caughtPokemon });
});

export default app;
