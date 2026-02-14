import express from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { Request, Response, NextFunction } from "express";
import { config, platCheck } from "./config.js";
import { createUser } from "./db/queries/users.js";
import { deleteAllUsers } from "./db/queries/delete.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

class HttpError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype); // important for instanceof
  }
}

class BadRequest extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

class Unauthorized extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

class Forbidden extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

app.use(express.json());

const handlerReadiness = (req: Request, res: Response) => {
  res.set({
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.send('OK')
}

const middlewareLogResponses =  (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    const stat = res.statusCode
    if (stat >=300) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${stat}`)
    }
  });
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    config.api.fileServerHits++;
  });
  next();
}

function middlewareMetricsShowoff(req: Request, res: Response, next: NextFunction) {
  res.send(`<html>
              <body>
                <h1>Welcome, Chirpy Admin</h1>
                <p>Chirpy has been visited ${config.api.fileServerHits} times!</p>
              </body>
          </html>`);
}

function middlewareMetricsReset(req: Request, res: Response, next: NextFunction) {
  res.send(config.api.fileServerHits = 0)
}

function validateChirp(req: Request, res: Response, next: NextFunction) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  try {
    if (!params.body) {
      return next(new BadRequest("Chirp body is required"));
    }

    if (params.body.length > 140) {
      return next(new BadRequest("Chirp is too long. Max length is 140"));
    }

    const bannedWords = ["kerfuffle", "sharbert", "fornax"];
    const regex = new RegExp(`\\b(${bannedWords.join("|")})\\b`, "gi");

    const filteredBody = params.body.replace(regex, "****");

    return res.status(200).json({ cleanedBody: filteredBody });

  } catch (error) {
    return res.status(500).json({"error": "Something went wrong"});
  };
}

async function createNewUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const newUser = await createUser({ email: email })

    const createdNewUser = {
      id: newUser.id,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      email: newUser.email
    };

    if (!newUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    return res.status(201).json(createdNewUser);
  } catch (err) {
    next(err)
  }
};

async function deleteUsers(req: Request, res: Response) {
  try {
    if (platCheck.platform != "dev") {
      return res.status(403);
    }
    const delData = await deleteAllUsers()
    res.status(201).json("Deleted all Users");
  } catch (err) {
    return new BadRequest("Error deleting users")
  }
  
}


function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  console.error(err);

  res.status(500).json({
    error: "Something went wrong on our end",
  });
}

app.use("/app", middlewareLogResponses, middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.get("/api/assets", handlerReadiness);
app.get("/admin/metrics", middlewareLogResponses, middlewareMetricsShowoff, handlerReadiness);
app.get("/api/reset", middlewareLogResponses, deleteUsers, middlewareMetricsReset);
app.post("/admin/reset", middlewareMetricsReset);
app.post("/api/validate_chirp", validateChirp);
app.post("/api/users", createNewUser);
app.use(errorHandler)

app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});
