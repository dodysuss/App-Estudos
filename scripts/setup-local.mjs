import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, ".env");
const envExamplePath = join(root, ".env.example");
const databaseOnly = process.argv.includes("--database-only");
const isWindows = process.platform === "win32";
const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");

process.chdir(root);

function execute(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.silent ? "ignore" : "inherit",
  });
  return result.status === 0;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil(check, attempts, interval) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (check()) return true;
    await delay(interval);
  }
  return false;
}

async function ensureDocker() {
  if (execute("docker", ["info"], { silent: true })) return;

  if (!isWindows) {
    throw new Error("O Docker não está em execução. Inicie-o e execute o comando novamente.");
  }

  const dockerDesktop = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
  if (!existsSync(dockerDesktop)) {
    throw new Error("Docker Desktop não encontrado. Instale-o ou inicie um PostgreSQL compatível manualmente.");
  }

  console.log("Iniciando o Docker Desktop...");
  const child = spawn(dockerDesktop, [], { detached: true, stdio: "ignore" });
  child.unref();

  const ready = await waitUntil(() => execute("docker", ["info"], { silent: true }), 60, 2000);
  if (!ready) throw new Error("O Docker não ficou pronto dentro do tempo esperado.");
}

async function ensureDatabase() {
  const containerExists = execute("docker", ["inspect", "app-estudos-postgres"], { silent: true });
  const started = containerExists
    ? execute("docker", ["start", "app-estudos-postgres"])
    : execute("docker", ["compose", "up", "-d", "database"]);

  if (!started) throw new Error("Não foi possível iniciar o PostgreSQL local.");

  const ready = await waitUntil(
    () => execute("docker", ["exec", "app-estudos-postgres", "pg_isready", "-U", "app_estudos", "-d", "app_estudos"], { silent: true }),
    45,
    2000,
  );
  if (!ready) throw new Error("O PostgreSQL local não ficou pronto dentro do tempo esperado.");
}

async function main() {
  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    console.log("Arquivo .env criado a partir de .env.example.");
  } else {
    const currentEnv = readFileSync(envPath, "utf8");
    if (!currentEnv.includes("localhost:54329/app_estudos")) {
      throw new Error("O .env existente não aponta para o banco local. Ele foi preservado; revise-o antes de usar setup:local.");
    }
    console.log("Arquivo .env local já existe e foi preservado.");
  }

  await ensureDocker();
  await ensureDatabase();
  console.log("PostgreSQL local pronto.");

  if (databaseOnly) return;

  if (!existsSync(prismaCli)) throw new Error("Dependências ausentes. Execute npm install antes de setup:local.");
  if (!execute(process.execPath, [prismaCli, "generate"])) throw new Error("Falha ao gerar o Prisma Client.");
  if (!execute(process.execPath, [prismaCli, "migrate", "deploy"])) throw new Error("Falha ao aplicar as migrations.");

  console.log("\nAmbiente local preparado. Execute: npm run dev");
}

main().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exitCode = 1;
});
