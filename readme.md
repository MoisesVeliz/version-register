# Registro de Versiones de Proyectos

Este script de Node.js permite registrar automáticamente las versiones de proyectos Node.js y .NET en un archivo CSV. Es útil para mantener un registro de las versiones de múltiples proyectos en un entorno de desarrollo.

## Características

- Analiza proyectos Node.js (buscando `package.json`) y proyectos .NET (buscando archivos `.csproj`).
- Puede analizar un solo proyecto o recorrer recursivamente un directorio.
- Registra la información en un archivo CSV con el formato de fecha YYYY-MM-DD.
- Incluye la fecha y hora exacta de cada registro en el CSV.
- Permite especificar el entorno (por ejemplo, producción, desarrollo, pruebas).

## Requisitos

- Node.js (versión 12 o superior recomendada)
- npm (normalmente viene con Node.js)

## Instalación

   ```
   npm install version-register
   ```

## Uso

El script puede ser ejecutado con varios argumentos de línea de comandos:

- `--path` o `-p`: Especifica la ruta del proyecto o directorio a analizar.
- `--env` o `-e`: Especifica el entorno (por ejemplo, production, development, testing).
- `--recursive` o `-r`: Analiza subdirectorios de forma recursiva.

### Ejemplos de uso:

1. Analizar un solo proyecto:
   ```
   vrg --path=/ruta/al/proyecto --env=production
   ```

2. Analizar recursivamente todos los proyectos en un directorio:
   ```
   vrg --path=/ruta/al/directorio --env=testing --recursive
   ```

3. Analizar el directorio actual:
   ```
   vrg --env=development
   ```

## Salida

El script generará un archivo CSV en una carpeta llamada `version-register` en el directorio actual. El nombre del archivo será la fecha actual en formato YYYY-MM-DD.

El archivo CSV contendrá las siguientes columnas:
- Fecha y Hora
- Tipo de Proyecto
- Nombre del Proyecto
- Versión
- Entorno

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios mayores antes de crear un pull request.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)