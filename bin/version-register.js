#!/usr/bin/env node

import path from "path";
import fs from "fs";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const obtenerVersion = () => {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error al leer la versión del package.json:', error);
    return 'desconocida';
  }
};

const version = obtenerVersion();

const argv = yargs(hideBin(process.argv))
  .option("path", {
    alias: "p",
    type: "string",
    description: "Ruta del proyecto o directorio a analizar",
  })
  .option("env", {
    alias: "e",
    type: "string",
    description: "Entorno de ejecución",
  })
  .option("recursive", {
    alias: "r",
    type: "boolean",
    description: "Analizar subdirectorios de forma recursiva",
  })
  .option("vers", {
    alias: "v",
    type: "boolean",
    description: "Muestra la versión del paquete",
  }).argv;

// Si se solicita la versión, mostrarla y salir
if (argv.vers) {
  console.log(`version-register v${version}`);
  process.exit(0);
}

const obtenerFechaActual = () => {
  try {
    const ahora = new Date();
    return {
      fechaArchivo: ahora.toISOString().split("T")[0],
      fechaHoraRegistro: ahora.toISOString().replace("T", " ").substr(0, 19),
    };
  } catch (error) {
    console.error("Error al obtener la fecha actual:", error);
    return { fechaArchivo: "ERROR", fechaHoraRegistro: "ERROR" };
  }
};

const registrarEnCSV = (filePath, datos) => {
  try {
    const existeArchivo = fs.existsSync(filePath);

    if (!existeArchivo) {
      fs.writeFileSync(
        filePath,
        "Fecha y Hora,Tipo de Proyecto,Nombre del Proyecto,Versión,Entorno\n"
      );
    }

    const contenidoCSV = fs.readFileSync(filePath, "utf8");
    if (!contenidoCSV.includes(datos)) {
      fs.appendFileSync(filePath, `${datos}\n`);
    } else {
      console.log(`Registro duplicado evitado para: ${datos}`);
    }
  } catch (error) {
    console.error("Error al registrar en CSV:", error);
  }
};

const getDirectories = (source) => {
  try {
    return fs
      .readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch (error) {
    console.error("Error al obtener directorios:", error);
    return [];
  }
};

const obtenerVersionNode = (packagePath) => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return {
      nombre: packageJson.name || "Nombre no definido",
      version: packageJson.version || "Versión no definida",
    };
  } catch (error) {
    console.error("Error al obtener versión de Node.js:", error);
    return { nombre: "ERROR", version: "ERROR" };
  }
};

const obtenerVersionDotNet = (csprojPath) => {
  try {
    const csprojContent = fs.readFileSync(csprojPath, "utf8");
    return {
      nombre:
        csprojContent.match(/<AssemblyName>([^<]+)<\/AssemblyName>/)?.[1] ||
        path.basename(csprojPath, ".csproj"),
      version:
        csprojContent.match(/<Version>([^<]+)<\/Version>/)?.[1] ||
        "Versión no definida",
    };
  } catch (error) {
    console.error("Error al obtener versión de .NET:", error);
    return { nombre: "ERROR", version: "ERROR" };
  }
};

const analizarProyecto = (rutaProyecto, entorno) => {
  try {
    // console.log(`Analizando proyecto en: ${rutaProyecto}`);
    const packagePath = path.join(rutaProyecto, "package.json");
    const csprojFiles = fs
      .readdirSync(rutaProyecto)
      .filter((file) => file.endsWith(".csproj"));

    const { fechaArchivo, fechaHoraRegistro } = obtenerFechaActual();
    const carpetaRegistro = path.join(process.cwd(), "version-register");
    if (!fs.existsSync(carpetaRegistro)) {
      fs.mkdirSync(carpetaRegistro, { recursive: true });
    }
    const archivoCSV = path.join(carpetaRegistro, `${fechaArchivo}.csv`);

    if (fs.existsSync(packagePath)) {
      const { nombre, version } = obtenerVersionNode(packagePath);
      // console.log(`Proyecto Node.js: ${nombre}, Versión: ${version}`);
      const datos = `${fechaHoraRegistro},Node.js,${nombre},${version},${entorno}`;
      registrarEnCSV(archivoCSV, datos);
    } else if (csprojFiles.length > 0) {
      const { nombre, version } = obtenerVersionDotNet(
        path.join(rutaProyecto, csprojFiles[0])
      );
      // console.log(`Proyecto .NET: ${nombre}, Versión: ${version}`);
      const datos = `${fechaHoraRegistro},.NET,${nombre},${version},${entorno}`;
      registrarEnCSV(archivoCSV, datos);
    } else {
      console.log(
        `No se encontró ni package.json ni .csproj en la carpeta ${rutaProyecto}`
      );
      const datos = `${fechaHoraRegistro},Desconocido,${path.basename(
        rutaProyecto
      )},No se encontró versión,${entorno}`;
      registrarEnCSV(archivoCSV, datos);
    }
  } catch (error) {
    console.error("Error al analizar proyecto:", error);
  }
};

const analizarRecursivamente = (ruta, entorno) => {
  try {
    analizarProyecto(ruta, entorno);

    const subdirectorios = getDirectories(ruta);
    for (const subdir of subdirectorios) {
      analizarRecursivamente(path.join(ruta, subdir), entorno);
    }
  } catch (error) {
    console.error("Error al analizar recursivamente:", error);
  }
};



const main = () => {
  try {
    const ruta = path.resolve(argv.path || ".");
    const entorno = argv.env || "development";
    const esRecursivo = argv.recursive || false;

    // console.log(`Iniciando análisis en: ${ruta}`);
    // console.log(`Entorno: ${entorno}`);
    // console.log(`Modo recursivo: ${esRecursivo ? "Sí" : "No"}`);

    if (esRecursivo) {
      analizarRecursivamente(ruta, entorno);
    } else {
      analizarProyecto(ruta, entorno);
    }

    // console.log("Análisis completado.");
  } catch (error) {
    console.error("Error en la ejecución principal:", error);
  }
};

main();
