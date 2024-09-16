import path from 'path';
import fs from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Ruta del proyecto o directorio a analizar'
  })
  .option('env', {
    alias: 'e',
    type: 'string',
    description: 'Entorno de ejecución'
  })
  .option('recursive', {
    alias: 'r',
    type: 'boolean',
    description: 'Analizar subdirectorios de forma recursiva'
  })
  .argv;

const obtenerFechaActual = () => {
  const ahora = new Date();
  return {
    fechaArchivo: ahora.toISOString().split('T')[0], // YYYY-MM-DD para el nombre del archivo
    fechaHoraRegistro: ahora.toISOString().replace('T', ' ').substr(0, 19) // YYYY-MM-DD HH:mm:ss para el registro
  };
};

const registrarEnCSV = (filePath, datos) => {
  const existeArchivo = fs.existsSync(filePath);
  
  if (!existeArchivo) {
    fs.writeFileSync(filePath, 'Fecha y Hora,Tipo de Proyecto,Nombre del Proyecto,Versión,Entorno\n');
  }

  const contenidoCSV = fs.readFileSync(filePath, 'utf8');
  if (!contenidoCSV.includes(datos)) {
    fs.appendFileSync(filePath, `${datos}\n`);
  } else {
    console.log(`Registro duplicado evitado para: ${datos}`);
  }
};

const getDirectories = (source) => {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
};

const obtenerVersionNode = (packagePath) => {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return {
    nombre: packageJson.name || 'Nombre no definido',
    version: packageJson.version || 'Versión no definida'
  };
};

const obtenerVersionDotNet = (csprojPath) => {
  const csprojContent = fs.readFileSync(csprojPath, 'utf8');
  return {
    nombre: csprojContent.match(/<AssemblyName>([^<]+)<\/AssemblyName>/)?.[1] || path.basename(csprojPath, '.csproj'),
    version: csprojContent.match(/<Version>([^<]+)<\/Version>/)?.[1] || 'Versión no definida'
  };
};

const analizarProyecto = (rutaProyecto, entorno) => {
  const packagePath = path.join(rutaProyecto, 'package.json');
  const csprojFiles = fs.readdirSync(rutaProyecto).filter(file => file.endsWith('.csproj'));

  const { fechaArchivo, fechaHoraRegistro } = obtenerFechaActual();
  const carpetaRegistro = path.join(process.cwd(), 'version-register');
  if (!fs.existsSync(carpetaRegistro)) {
    fs.mkdirSync(carpetaRegistro, { recursive: true });
  }
  const archivoCSV = path.join(carpetaRegistro, `${fechaArchivo}.csv`);

  if (fs.existsSync(packagePath)) {
    const { nombre, version } = obtenerVersionNode(packagePath);
    console.log(`Proyecto Node.js: ${nombre}, Versión: ${version}`);
    const datos = `${fechaHoraRegistro},Node.js,${nombre},${version},${entorno}`;
    registrarEnCSV(archivoCSV, datos);
  } else if (csprojFiles.length > 0) {
    const { nombre, version } = obtenerVersionDotNet(path.join(rutaProyecto, csprojFiles[0]));
    console.log(`Proyecto .NET: ${nombre}, Versión: ${version}`);
    const datos = `${fechaHoraRegistro},.NET,${nombre},${version},${entorno}`;
    registrarEnCSV(archivoCSV, datos);
  } else {
    console.log(`No se encontró ni package.json ni .csproj en la carpeta ${rutaProyecto}`);

  }
};

const analizarRecursivamente = (ruta, entorno) => {
    
    const subdirectorios = getDirectories(ruta);
    
    for (const subdir of subdirectorios) {
        analizarProyecto(path.join(ruta, subdir), entorno);
  }
};

const main = () => {
  const ruta = path.resolve(argv.path || '.');
  const entorno = argv.env || 'development';
  const esRecursivo = argv.recursive || false;

  if (esRecursivo) {
    analizarRecursivamente(ruta, entorno);
  } else {
    analizarProyecto(ruta, entorno);
  }
};

main();