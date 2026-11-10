import { prisma } from "@/lib/prisma";

type BinderByteTrackResponse = {
  status?: number;
  message?: string;
  data?: {
    summary?: {
      awb?: string;
      courier?: string;
      service?: string;
      status?: string;
      date?: string;
      desc?: string;
    };
    detail?: {
      origin?: string;
      destination?: string;
      shipper?: string;
      receiver?: string;
    };
    history?: Array<{
      date?: string;
      desc?: string;
      location?: string;
    }>;
  };
};

const courierCodes: Record<string, string> = {
  jne: "jne",
  "jne express": "jne",
  pos: "pos",
  "pos indonesia": "pos",
  sicepat: "sicepat",
  "si cepat": "sicepat",
  jnt: "jnt",
  "j&t": "jnt",
  anteraja: "anteraja",
  wahana: "wahana",
  rpx: "rpx",
  lion: "lion",
  "lion parcel": "lion",
  ninja: "ninja",
  "ninja xpress": "ninja",
  tiki: "tiki",
  pcp: "pcp",
  jet: "jet",
  rex: "rex",
  first: "first",
  ide: "ide",
  "id express": "ide",
  spx: "spx",
  "shopee express": "spx",
  kgx: "kgx",
  sap: "sap",
  jxe: "jxe",
  "j&t cargo": "jnt_cargo",
  "jnt cargo": "jnt_cargo",
  lex: "lex",
  "lex id": "lex",
  "indah cargo": "indah_cargo",
  dakota: "dakota",
  "ant cargo": "ant_cargo",
  "next logistics": "next_logistik",
  gtl: "gtl",
  "kurir tokopedia": "kurir_tokopedia",
  "laris cargo": "laris_cargo",
};

export class PackageTrackingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PackageTrackingError";
  }
}

export async function trackPackage(
  packageId: string,
  user: { id: string; role: "ADMIN" | "SELLER" | "PETUGAS" },
) {
  const packageRecord = await prisma.package.findFirst({
    where: {
      id: packageId,
      ...(user.role === "SELLER" ? { store: { sellerId: user.id } } : {}),
    },
    select: {
      barcode: true,
      expedition: { select: { nama: true } },
    },
  });

  if (!packageRecord) {
    throw new PackageTrackingError("Paket tidak ditemukan.", 404);
  }

  if (!packageRecord.barcode) {
    throw new PackageTrackingError("Paket belum memiliki nomor resi.", 422);
  }

  const courier = packageRecord.expedition?.nama
    ? courierCodes[packageRecord.expedition.nama.trim().toLocaleLowerCase("id-ID")]
    : undefined;

  if (!courier) {
    throw new PackageTrackingError(
      "Kode ekspedisi paket belum didukung untuk pelacakan BinderByte.",
      422,
    );
  }

  const apiKey = process.env.PACKAGE_TRACKING_API_KEY;
  if (!apiKey) {
    console.error("Package tracking is not configured: missing API key.");
    throw new PackageTrackingError(
      "Layanan pelacakan belum dikonfigurasi. Hubungi administrator.",
      503,
    );
  }

  const url = new URL("/v1/track", "https://api.binderbyte.com");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("courier", courier);
  url.searchParams.set("awb", packageRecord.barcode);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("BinderByte tracking request failed:", error);
    throw new PackageTrackingError(
      "Layanan pelacakan tidak dapat dihubungi. Coba lagi nanti.",
      502,
    );
  }

  let result: BinderByteTrackResponse;
  try {
    result = (await response.json()) as BinderByteTrackResponse;
  } catch (error) {
    console.error("BinderByte returned an invalid response:", error);
    throw new PackageTrackingError(
      "Respons layanan pelacakan tidak valid. Coba lagi nanti.",
      502,
    );
  }

  if (!response.ok || result.status !== 200 || !result.data?.summary) {
    const providerStatus =
      typeof result.status === "number" &&
      result.status >= 400 &&
      result.status < 600
        ? result.status
        : undefined;
    throw new PackageTrackingError(
      result.message ?? "Informasi pelacakan tidak tersedia.",
      response.status >= 400 && response.status < 600
        ? response.status
        : providerStatus ?? 502,
    );
  }

  return {
    summary: result.data.summary,
    detail: result.data.detail ?? {},
    history: result.data.history ?? [],
  };
}
