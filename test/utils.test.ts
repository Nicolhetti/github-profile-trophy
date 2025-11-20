// deno-lint-ignore no-import-prefix
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { abridgeScore, sanitizeInput, validateUsername } from "../src/utils.ts";

Deno.test("abridgeScore formatea correctamente números pequeños", () => {
  assertEquals(abridgeScore(0), "0pt");
  assertEquals(abridgeScore(5), "5pt");
  assertEquals(abridgeScore(999), "999pt");
});

Deno.test("abridgeScore formatea correctamente números grandes", () => {
  assertEquals(abridgeScore(1000), "1.0kpt");
  assertEquals(abridgeScore(1500), "1.5kpt");
  assertEquals(abridgeScore(10000), "10.0kpt");
});

Deno.test("validateUsername valida correctamente nombres de usuario", () => {
  assertEquals(validateUsername("Nicolhetti"), true);
  assertEquals(validateUsername("user-name"), true);
  assertEquals(validateUsername("user123"), true);
  assertEquals(validateUsername(""), false);
  assertEquals(validateUsername(null), false);
  assertEquals(validateUsername("-username"), false);
  assertEquals(validateUsername("user--name"), false);
});

Deno.test("sanitizeInput elimina caracteres peligrosos", () => {
  assertEquals(sanitizeInput("test<script>"), "testscript");
  assertEquals(sanitizeInput("normal-text"), "normal-text");
  assertEquals(sanitizeInput("test'123\""), "test123");
});
