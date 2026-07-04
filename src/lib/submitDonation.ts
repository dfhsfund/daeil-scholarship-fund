export type DonationInput = {
  name: string;
  phone: string;
  grade: string;
  amount: number;
};

function getSubmitUrl() {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();
  if (!url) {
    throw new Error("VITE_APPS_SCRIPT_URL is not configured");
  }
  return url;
}

export async function submitDonation(input: DonationInput) {
  const res = await fetch(getSubmitUrl(), {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      grade: input.grade,
      amount: input.amount,
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { ok: true; id: number }
    | { ok: false; error?: string }
    | null;

  if (!res.ok || !data?.ok) {
    throw new Error(data && "error" in data && data.error ? data.error : "신청 접수에 실패했습니다.");
  }

  return data;
}

export function getSheetUrl() {
  return import.meta.env.VITE_SHEET_URL?.trim() || "";
}
