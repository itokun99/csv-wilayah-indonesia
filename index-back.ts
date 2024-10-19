import fs from "fs";
import path from "path";
import { createObjectCsvWriter } from "csv-writer";

// Fungsi untuk membaca file SQL
const readSQLFile = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf-8");
};

// Fungsi untuk mengekstrak dan mengonversi data
const convertSQLToCSV = (sql: string) => {
  const provinsi: any[] = [];
  const kabupaten: any[] = [];
  const kecamatan: any[] = [];
  const kelurahan: any[] = [];

  // Regex untuk menangkap bagian VALUES
  const insertRegex =
    /INSERT INTO wilayah \(kode, nama\)\s*VALUES\s*((?:\([^\)]+\),?\s*)+)/g;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const valuesString = match[1]; // Mengambil bagian values dari query SQL
    const values = valuesString
      .split(/\),\s*\(/)
      .map((v) => v.replace(/[()']/g, "").trim());

    values.forEach((value) => {
      const [kode, nama] = value.split(",");
      const cleanKode = kode.trim().replace(/\.+/g, ""); // Menghapus titik dari kode

      // Menentukan tingkat berdasarkan panjang kode
      if (kode.length === 2) {
        // Provinsi
        provinsi.push({ id: cleanKode, nama: nama.trim(), kode: kode.trim() });
      } else if (kode.length === 5) {
        // Kabupaten
        kabupaten.push({
          id: cleanKode,
          provinsi_id: cleanKode.slice(0, 2),
          nama: nama.trim(),
          kode: kode.trim(),
        });
      } else if (kode.length === 8) {
        // Kecamatan
        kecamatan.push({
          id: cleanKode,
          kabupaten_id: cleanKode.slice(0, 5),
          nama: nama.trim(),
          kode: kode.trim(),
        });
      } else if (kode.length === 13) {
        // Kelurahan
        kelurahan.push({
          id: cleanKode,
          kecamatan_id: cleanKode.slice(0, 8),
          nama: nama.trim(),
          kode: kode.trim(),
        });
      }
    });
  }

  return { provinsi, kabupaten, kecamatan, kelurahan };
};

// Fungsi untuk menulis data ke CSV
const writeCSV = async (data: any[], fileName: string) => {
  if (data.length === 0) {
    console.warn(`Tidak ada data untuk ditulis ke ${fileName}.`);
    return;
  }

  const csvWriter = createObjectCsvWriter({
    path: fileName,
    header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
  });

  await csvWriter.writeRecords(data);
  console.log(`Data berhasil ditulis ke ${fileName}.`);
};

// Main function
const main = async () => {
  const sqlFilePath = path.join(__dirname, "wilayah.sql"); // Pastikan path sesuai dengan file SQL Anda
  const sqlContent = readSQLFile(sqlFilePath);
  const { provinsi, kabupaten, kecamatan, kelurahan } =
    convertSQLToCSV(sqlContent);

  // Menulis data ke CSV
  await writeCSV(provinsi, path.join(__dirname, "provinsi.csv"));
  await writeCSV(kabupaten, path.join(__dirname, "kabupaten.csv"));
  await writeCSV(kecamatan, path.join(__dirname, "kecamatan.csv"));
  await writeCSV(kelurahan, path.join(__dirname, "kelurahan.csv"));

  console.log("Semua data telah disimpan ke CSV.");
};

main().catch((err) => {
  console.error("Error:", err);
});
