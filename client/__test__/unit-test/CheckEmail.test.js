import { isEmailValid } from "../../src/components/Register";

describe("Test email validation", () => {
  test("Empty String is an invalid email", () => {
    expect(isEmailValid("")).toBeFalsy();
  });

  test("String without '@' is an invalid email", () => {
    expect(isEmailValid("lockout.com")).toBeFalsy();
  });

  test("String without '.' is an invalid email", () => {
    expect(isEmailValid("lockout@gmail")).toBeFalsy();
  });

  test("Test an example of a valid email", () => {
    expect(isEmailValid("lockout@gmail.com")).toBeTruthy();
  });
});
