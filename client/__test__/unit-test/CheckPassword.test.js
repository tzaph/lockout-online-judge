import { isPasswordMatch, isPasswordLong } from "../../src/components/Register";

describe("Test password validation", () => {
  test("Two matching strings implies password confirmation is successful", () => {
    expect(isPasswordMatch("joseph", "joseph")).toBeTruthy();
  });

  test("Two not matching strings implies password confirmation is unsuccessful", () => {
    expect(isPasswordMatch("joseph", "josephh")).toBeFalsy();
  });

  test("String with less than 6 characters is an invalid password", () => {
    expect(isPasswordLong("jeo")).toBeFalsy();
  });

  test("String with more than or equal to 6 characters is a valid password", () => {
    expect(isPasswordLong("joseph")).toBeTruthy();
  });
});
