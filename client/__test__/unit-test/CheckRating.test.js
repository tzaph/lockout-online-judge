import { isRatingValid } from "../../src/components/ProblemRecommendation";

describe("Test rating validation", () => {
  test("Empty String is an invalid rating number", () => {
    expect(isRatingValid("")).toBeFalsy();
  });

  test("Non-numerical value of string is an invalid rating number", () => {
    expect(isRatingValid("lock")).toBeFalsy();
  });

  test("A number below 800 is an invalid rating", () => {
    expect(isRatingValid("700")).toBeFalsy();
  });

  test("A number above 3500 is an invalid rating", () => {
    expect(isRatingValid("3600")).toBeFalsy();
  });

  test("A number not divisible by 100 is an invalid rating", () => {
    expect(isRatingValid("1111")).toBeFalsy();
  });

  test("Test an example of a valid rating", () => {
    expect(isRatingValid("1000")).toBeTruthy();
  });
});
