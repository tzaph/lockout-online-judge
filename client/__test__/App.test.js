import React from "react";
import renderer from "react-test-renderer";
import App from "../src/App";

jest.mock("../src/firebase", () => ({
  firebase: {
    auth: () => ({
      onAuthStateChanged: jest.fn(),
    }),
  },
}));

describe("<App />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<App />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
