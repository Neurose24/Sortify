import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardShell, PageHeading } from "./dashboard-shell";

type ScanHistoryItem = {
  id: string;
  barcode: string;
  hasilScan: string;
  statusPaket: string | null;
  statusPengamanan: string | null;
  keterangan: string | null;
  scannedAt: string;
  userName: string;
  package: {
    nomorPesanan: string;
    store: {
      nama: string;
      marketplace: { nama: string };
    };
    expedition: { nama: string } | null;
  } | null;
};

const resultLabels: Record<string, string> = {
  BERHASIL: "Berhasil",
  BARCODE_TIDAK_DIKENAL: "Barcode tidak dikenal",
  PREFIX_TIDAK_DIKENAL: "Prefix tidak dikenal",
  SUDAH_PERNAH_DISCAN: "Sudah pernah discan",
  PAKET_PENDING: "Paket pending",
  PAKET_BATAL: "Paket batal",
  PAKET_DUPLIKAT: "Paket duplikat",
  GAGAL: "Gagal",
};

function resultTone(
  result: string,
): "success" | "warning" | "danger" | "neutral" {
  if (result === "BERHASIL") return "success";
  if (result === "PAKET_BATAL" || result === "PAKET_DUPLIKAT" || result === "GAGAL") {
    return "danger";
  }
  if (result === "SUDAH_PERNAH_DISCAN") return "neutral";
  return "warning";
}

function formatScannedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ScanHistoryPage({
  role,
  userName,
  history,
}: {
  role: "admin" | "petugas";
  userName: string;
  history: ScanHistoryItem[];
}) {
  return (
    <DashboardShell
      role={role}
      section="Riwayat Scan"
      userName={userName}
    >
      <div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
        <PageHeading
          title="Riwayat scan"
          description={
            role === "admin"
              ? "Semua percobaan scan diurutkan dari yang terbaru."
              : "Percobaan scan yang Anda lakukan, terbaru lebih dahulu."
          }
        />
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-semibold-exact">
              {role === "admin" ? "Riwayat global" : "Riwayat saya"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {history.length} terbaru
            </span>
          </div>
          {history.length === 0 ? (
            <p className="border-t border-line px-6 py-12 text-center text-sm text-muted-foreground">
              Belum ada riwayat scan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead className="border-y border-line bg-canvas text-muted-foreground">
                  <tr>
                    {[
                      "Waktu",
                      ...(role === "admin" ? ["Petugas"] : []),
                      "Barcode",
                      "Pesanan / toko",
                      "Hasil",
                      "Keterangan",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 font-medium-exact"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-line">
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatScannedAt(item.scannedAt)} WIB
                      </td>
                      {role === "admin" && (
                        <td className="px-5 py-4">{item.userName}</td>
                      )}
                      <td className="max-w-56 break-all px-5 py-4 font-mono-exact">
                        {item.barcode}
                      </td>
                      <td className="px-5 py-4">
                        {item.package ? (
                          <>
                            <p>{item.package.nomorPesanan}</p>
                            <p className="mt-1 text-muted-foreground">
                              {item.package.store.nama} ·{" "}
                              {item.package.store.marketplace.nama}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Paket tidak ditemukan
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={resultTone(item.hasilScan)}>
                          {resultLabels[item.hasilScan] ?? item.hasilScan}
                        </Badge>
                      </td>
                      <td className="max-w-72 px-5 py-4 text-muted-foreground">
                        {item.keterangan ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
