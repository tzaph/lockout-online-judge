import { rankLetter } from "../../src/components/Matchmaking";

describe("Test Rank Letter Function", () => {
  test("Test 900 rating is D rank", () => {
    expect(rankLetter(900)).toEqual("D");
  });

  test("Test 1000 rating is C rank", () => {
    expect(rankLetter(1000)).toEqual("C");
  });

  test("Test 1200 rating is B rank", () => {
    expect(rankLetter(1200)).toEqual("B");
  });

  test("Test 1400 rating is A- rank", () => {
    expect(rankLetter(1400)).toEqual("A-");
  });

  test("Test 1700 rating is A rank", () => {
    expect(rankLetter(1700)).toEqual("A");
  });

  test("Test 2000 rating is A+ rank", () => {
    expect(rankLetter(2000)).toEqual("A+");
  });

  test("Test 2300 rating is S- rank", () => {
    expect(rankLetter(2300)).toEqual("S-");
  });

  test("Test 2500 rating is S rank", () => {
    expect(rankLetter(2500)).toEqual("S");
  });

  test("Test 2700 rating is S+ rank", () => {
    expect(rankLetter(2700)).toEqual("S+");
  });

  test("Test 3000 rating is SS rank", () => {
    expect(rankLetter(3000)).toEqual("SS");
  });
});
