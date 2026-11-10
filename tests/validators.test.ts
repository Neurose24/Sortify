import assert from "node:assert/strict";
import test from "node:test";
import {
  createUserInputSchema,
  expeditionInputSchema,
  marketplaceInputSchema,
  prefixRuleInputSchema,
  storeInputSchema,
  updateUserInputSchema,
} from "../src/validators/master-data.validator";
import { passwordChangeSchema } from "../src/validators/password-change.validator";
import { reportFilterSchema } from "../src/validators/report.validator";

test("report filters accept bounded valid criteria and defaults", () => {
  assert.deepEqual(reportFilterSchema.parse({}), {
    storeId: "",
    marketplaceId: "",
    expeditionId: "",
    status: "",
    from: "",
    to: "",
  });

  assert.equal(
    reportFilterSchema.safeParse({
      storeId: " store-1 ",
      marketplaceId: "marketplace-1",
      expeditionId: "expedition-1",
      status: "PENDING",
      from: "2026-02-28",
      to: "2026-03-01",
    }).success,
    true,
  );
});

test("report filters reject invalid or incomplete date ranges and conditions", () => {
  for (const filters of [
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-03-02", to: "2026-03-01" },
    { from: "2026-03-01", to: "" },
    { from: "", to: "2026-03-01" },
    { status: "CANCELED" },
  ]) {
    assert.equal(reportFilterSchema.safeParse(filters).success, false);
  }
});

test("marketplace, store, and expedition data require trimmed names", () => {
  assert.deepEqual(marketplaceInputSchema.parse({ nama: "  Shopee  " }), {
    nama: "Shopee",
  });
  assert.equal(
    storeInputSchema.safeParse({
      nama: "  Toko A ",
      marketplaceId: "marketplace-1",
      sellerId: "seller-1",
    }).success,
    true,
  );
  assert.equal(
    storeInputSchema.safeParse({
      nama: "Toko A",
      marketplaceId: "",
      sellerId: "seller-1",
    }).success,
    false,
  );
  assert.equal(expeditionInputSchema.safeParse({ nama: "  " }).success, false);
});

test("prefix rules require a criterion and constrain barcode length", () => {
  assert.equal(
    prefixRuleInputSchema.safeParse({
      expeditionId: "expedition-1",
      awalan: "",
      akhiran: "",
      panjang: "",
    }).success,
    false,
  );
  assert.deepEqual(
    prefixRuleInputSchema.parse({
      expeditionId: "expedition-1",
      awalan: " JNE ",
      akhiran: "",
      panjang: "",
    }),
    {
      expeditionId: "expedition-1",
      awalan: "JNE",
      akhiran: "",
      panjang: "",
    },
  );
  assert.equal(
    prefixRuleInputSchema.safeParse({
      expeditionId: "expedition-1",
      awalan: "",
      akhiran: "",
      panjang: "12",
    }).success,
    true,
  );
  assert.equal(
    prefixRuleInputSchema.safeParse({
      expeditionId: "expedition-1",
      awalan: "",
      akhiran: "",
      panjang: "1001",
    }).success,
    false,
  );
});

test("user creation enforces role, username, and password requirements", () => {
  assert.equal(
    createUserInputSchema.safeParse({
      nama: "  Nama Pengguna ",
      username: " akun ",
      role: "SELLER",
      password: "password8",
    }).success,
    true,
  );
  assert.equal(
    createUserInputSchema.safeParse({
      nama: "Nama",
      username: "akun",
      role: "SELLER",
      password: "short",
    }).success,
    false,
  );
  assert.equal(
    createUserInputSchema.safeParse({
      nama: "Nama",
      username: "akun",
      role: "UNKNOWN",
      password: "password8",
    }).success,
    false,
  );
  assert.equal(
    updateUserInputSchema.safeParse({
      nama: "Nama",
      username: "akun",
      role: "SELLER",
      password: "",
    }).success,
    true,
  );
});

test("password changes require the current password and matching new passwords", () => {
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    }).success,
    true,
  );
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "",
      newPassword: "new-password",
      confirmPassword: "new-password",
    }).success,
    false,
  );
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "short",
      confirmPassword: "short",
    }).success,
    false,
  );
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "different-password",
    }).success,
    false,
  );
});
