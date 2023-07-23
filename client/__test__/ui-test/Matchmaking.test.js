import React from "react";
import renderer from "react-test-renderer";
import Matchmaking from "../../src/components/Matchmaking";
import { BrowserRouter as Router } from "react-router-dom";

describe("<Matchmaking />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <Matchmaking />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
