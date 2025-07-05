import fs from 'fs/promises'

/**
 * Elimina un archivo temporal de forma segura.
 * @param filePath Ruta del archivo a eliminar
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error: any) {
    // Si el archivo no existe, ignorar el error
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}